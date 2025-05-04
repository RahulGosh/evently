"use server";

import Stripe from "stripe";
import {
  CheckoutOrderParams,
  CreateOrderParams,
  GetOrdersByEventParams,
  GetOrdersByUserParams,
} from "@/types";
import { db } from "@/lib/db";
import { incrementCouponUsage, validateCoupon } from "./coupon.action";

export type CheckoutOrderWithCouponParams = CheckoutOrderParams & {
  code?: string;
};

export type CreateOrderWithCouponParams = CreateOrderParams & {
  couponId?: string;
  discountAmount?: string;
};

export const checkoutOrder = async (order: CheckoutOrderWithCouponParams) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  console.log('Starting checkout process for order:', {
    eventId: order.eventId,
    quantity: order.quantity,
    couponCode: order?.code || 'none'
  });

  const basePrice = order.isFree ? 0 : Number(order.price) * 100;
  let totalAmount = basePrice * order.quantity;
  let couponId = null;
  let discountAmount = "0";
  
  if (order?.code) {
    try {
      console.log('Validating coupon:', order.code);
      const couponResult = await validateCoupon({
        code: order.code,
        eventId: order.eventId,
      });

      console.log('Coupon validation result:', {
        valid: couponResult.valid,
        message: couponResult.message,
        coupon: couponResult.coupon ? {
          id: couponResult.coupon.id,
          code: couponResult.coupon.code,
          isActive: couponResult.coupon.isActive,
          startDate: couponResult.coupon.startDate,
          endDate: couponResult.coupon.endDate
        } : null
      });

      if (couponResult.valid && couponResult.coupon) {
        const coupon = couponResult.coupon;
        const totalBeforeDiscount = basePrice * order.quantity;
        
        // Calculate total discount
        const totalDiscount = coupon.isPercentage
          ? Math.round((totalBeforeDiscount * coupon.discount) / 100)
          : Math.min(coupon.discount * 100, totalBeforeDiscount);
        
        // Calculate final total
        totalAmount = Math.max(totalBeforeDiscount - totalDiscount, 0);
        discountAmount = (totalDiscount / 100).toString();
        couponId = coupon.id;

        console.log('Coupon applied successfully:', {
          originalAmount: (totalBeforeDiscount / 100).toFixed(2),
          discountAmount: (totalDiscount / 100).toFixed(2),
          finalAmount: (totalAmount / 100).toFixed(2),
          couponId
        });
      } else {
        console.warn('Coupon validation failed:', couponResult.message);
      }
    } catch (error) {
      console.error("Detailed coupon application error:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  try {
    console.log('Creating Stripe checkout session with:', {
      totalAmount: totalAmount / 100,
      quantity: order.quantity,
      couponApplied: couponId !== null
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: "inr",
          unit_amount: totalAmount,
          product_data: {
            name: `${order.quantity} x ${order.eventTitle}`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        eventId: order.eventId,
        buyerId: order.buyerId,
        quantity: order.quantity.toString(),
        couponId: couponId || "",
        discountAmount: discountAmount,
      },
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/protected/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/`,
    });
    
    console.log('Checkout session created:', session.id);
    return { url: session.url };
  } catch (error) {
    console.error("Checkout session creation failed:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      orderDetails: {
        eventId: order.eventId,
        buyerId: order.buyerId,
        amount: totalAmount / 100
      }
    });
    throw error;
  }
};

export const createOrder = async (order: CreateOrderWithCouponParams) => {
  try {
    // First verify the event exists and has tickets
    const event = await db.event.findUnique({
      where: { id: order.eventId },
      select: { 
        ticketsLeft: true,
      },
    });
    
    if (!event) {
      throw new Error("Event not found.");
    }

    if (event.ticketsLeft <= 0) {
      throw new Error("No tickets available for this event.");
    }

    // Start transaction
    return await db.$transaction(async (prisma) => {
      // Update event tickets
      const updatedEvent = await prisma.event.update({
        where: { id: order.eventId },
        data: { 
          ticketsLeft: { decrement: order.quantity },
        },
      });
    
      if (updatedEvent.ticketsLeft < 0) {
        throw new Error("Not enough tickets available.");
      }

      // Prepare order data
      const orderData = {
        stripeId: order.stripeId,
        totalAmount: order.totalAmount,
        quantity: order.quantity,
        event: { connect: { id: order.eventId } },
        buyer: { connect: { id: order.buyerId } },
        discountAmount: order.discountAmount || "0",
        ...(order.couponId && { coupon: { connect: { id: order.couponId } } }),
      };

      // Create the order
      const createdOrder = await prisma.order.create({
        data: orderData,
      });

      // Increment coupon usage if applicable
      if (order.couponId) {
        await prisma.coupon.update({
          where: { id: order.couponId },
          data: { currentUses: { increment: 1 } },
        });
      }
    
      return createdOrder;
    });
    
  } catch (error) {
    console.error("Error in createOrder:", error);
    throw error;
  }
};

export async function getOrdersByUser({
  userId,
  limit = 6,
  page = 1,
}: GetOrdersByUserParams) {
  try {
    const skipAmount = (Number(page) - 1) * limit;

    // Fetch orders with event and organizer details
    const orders = await db.order.findMany({
      where: { buyerId: userId || undefined },
      orderBy: { createdAt: "desc" },
      skip: skipAmount,
      take: limit,
      include: {
        event: {
          include: {
            category: true,
            organizer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        coupon: true, // Include coupon details
      },
    });

    // Count total orders
    const totalCount = await db.order.count({
      where: { buyerId: userId || undefined },
    });

    return {
      data: orders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
}

export async function getOrdersByEvent({ searchString, eventId, sort = "desc" }: GetOrdersByEventParams) {
  try {
    if (!eventId) throw new Error("Event ID is required");

    const orders = await db.order.findMany({
      where: {
        eventId,
        buyer: {
          OR: [
            { name: { contains: searchString, mode: "insensitive" } },
          ],
        },
      },
      select: {
        id: true,
        totalAmount: true,
        discountAmount: true,
        createdAt: true,
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        buyer: {
          select: {
            name: true,
          },
        },
        coupon: {
          select: {
            code: true,
          },
        },
      },
      orderBy: { createdAt: sort },
    });

    return orders.map((order) => ({
      _id: order.id,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount || "0",
      code: order.coupon?.code || null,
      createdAt: order.createdAt,
      eventTitle: order.event.title,
      eventId: order.event.id,
      buyer: order.buyer.name,
    }));
  } catch (error) {
    console.error("Error fetching orders by event:", error);
    throw error;
  }
}

export async function verifyOrder(session_id: string) {
  if (!session_id) {
    return { success: false, message: "Session ID is required" };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripe.checkout.sessions.retrieve(
      session_id,
      { expand: ["payment_intent", "line_items"] }
    );

    // Check payment status
    if (session.payment_status !== "paid") {
      return { 
        success: false,
        message: "Payment was not successful",
        sessionId: session.id,
        amount: session.amount_total ? session.amount_total / 100 : 0
      };
    }

    // Get the amount from line items if available
    const amount = session.amount_total 
      ? session.amount_total / 100 
      : session.line_items?.data[0]?.amount_total 
        ? session.line_items.data[0].amount_total / 100 
        : 0;

    // Try to find existing order
    const order = await db.order.findFirst({
      where: { stripeId: session.id },
      include: {
        event: {
          include: {
            organizer: { select: { name: true, id: true } },
          },
        },
        coupon: { select: { code: true, discount: true, isPercentage: true } },
      },
    });

    if (order) {
      return { 
        success: true,
        order,
        sessionId: session.id,
        amount
      };
    }

    // If no order exists but payment is successful, create one
    if (session.payment_status === "paid") {
      const newOrder = await createOrder({
        stripeId: session.id,
        eventId: session?.metadata.eventId,
        buyerId: session?.metadata.buyerId,
        totalAmount: amount.toString(),
        quantity: parseInt(session?.metadata.quantity),
        couponId: session?.metadata.couponId || undefined,
        discountAmount: session?.metadata.discountAmount || "0",
      });

      return {
        success: true,
        order: newOrder,
        sessionId: session.id,
        amount
      };
    }

    return { 
      success: true,
      session,
      sessionId: session.id,
      amount
    };

  } catch (error: any) {
    console.error("Error verifying order:", error);
    return { 
      success: false,
      message: "Failed to verify order", 
      error: error.message 
    };
  }
}