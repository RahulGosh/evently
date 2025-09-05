"use server";

import Stripe from "stripe";
import {
  CheckoutOrderParams,
  CreateOrderParams,
  GetOrdersByEventParams,
  GetOrdersByUserParams,
  VerifyOrderResponse,
} from "@/types";
import { db } from "@/lib/db";
import { validateCoupon } from "./coupon.action";
import { syncUser } from "./user.action";

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
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
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
  console.log("🔄 Starting order creation for:", {
    eventId: order.eventId,
    buyerId: order.buyerId,
    quantity: order.quantity
  });

  try {
    // First verify the event exists
    const event = await db.event.findUnique({
      where: { id: order.eventId },
      select: { 
        id: true,
        ticketsLeft: true,
        title: true,
      },
    });
    
    if (!event) {
      throw new Error("Event not found.");
    }

    console.log(`🎫 Event found: ${event.title}, Tickets left: ${event.ticketsLeft}`);

    if (event.ticketsLeft < order.quantity) {
      throw new Error(`Only ${event.ticketsLeft} tickets available, but requested ${order.quantity}`);
    }

    // Start transaction
    return await db.$transaction(async (prisma) => {
      console.log("🔒 Transaction started");

      // Update event tickets
      const updatedEvent = await prisma.event.update({
        where: { id: order.eventId },
        data: { 
          ticketsLeft: { decrement: order.quantity },
        },
        select: { ticketsLeft: true }
      });
    
      console.log(`📉 Tickets updated. Remaining: ${updatedEvent.ticketsLeft}`);

      if (updatedEvent.ticketsLeft < 0) {
        throw new Error("Not enough tickets available after update.");
      }

      // Prepare order data
      const orderData: any = {
        stripeId: order.stripeId,
        totalAmount: order.totalAmount,
        quantity: order.quantity,
        eventId: order.eventId,
        buyerId: order.buyerId,
        discountAmount: order.discountAmount || "0",
      };

      // Add coupon relation if applicable
      if (order.couponId) {
        orderData.couponId = order.couponId;
      }

      console.log("📝 Creating order with data:", orderData);

      // Create the order
      const createdOrder = await prisma.order.create({
        data: orderData,
        include: {
          event: true,
          buyer: true,
          coupon: true,
        }
      });

      console.log("✅ Order created:", createdOrder.id);

      // Increment coupon usage if applicable
      if (order.couponId) {
        await prisma.coupon.update({
          where: { id: order.couponId },
          data: { currentUses: { increment: 1 } },
        });
        console.log("🎫 Coupon usage incremented");
      }
    
      return createdOrder;
    });
    
  } catch (error) {
    console.error("❌ Error in createOrder:", error);
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
                fullName: true,
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
            { fullName: { contains: searchString, mode: "insensitive" } },
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
            fullName: true,
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
      buyer: order.buyer.fullName,
    }));
  } catch (error) {
    console.error("Error fetching orders by event:", error);
    throw error;
  }
}

export async function verifyOrder(session_id: string): Promise<VerifyOrderResponse> {
  if (!session_id) {
    return { 
      success: false, 
      message: "Session ID is required",
      errorType: "metadata_missing"
    };
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
        errorType: "payment_failed",
        sessionId: session.id,
        amount: session.amount_total ? session.amount_total / 100 : 0
      };
    }

    // Safely access metadata with type guards
    if (!session.metadata) {
      return {
        success: false,
        message: "Missing required metadata in session",
        errorType: "metadata_missing"
      };
    }

    const { 
      eventId, 
      buyerId, 
      quantity, 
      couponId, 
      discountAmount,
    } = session.metadata;

    if (!eventId || !buyerId) {
      return {
        success: false,
        message: "Missing required event or buyer information",
        errorType: "metadata_missing"
      };
    }

    // Sync user before order verification
    console.log("🔄 Syncing user for order verification:", buyerId);
    let databaseUserId: string;
    
    try {
      const user = await syncUser(buyerId);
      databaseUserId = user.id;
      console.log("✅ User synced successfully, database ID:", databaseUserId);
    } catch (syncError) {
      console.error("❌ Failed to sync user during verification:", syncError);
      return {
        success: false,
        message: "Failed to sync user information",
        sessionId: session.id
      };
    }

    // Calculate amount with proper type safety
    const amount = session.amount_total 
      ? session.amount_total / 100 
      : session.line_items?.data[0]?.amount_total 
        ? session.line_items.data[0].amount_total / 100 
        : 0;

    // Try to find existing order
    const existingOrder = await db.order.findFirst({
      where: { stripeId: session.id },
      include: {
        event: {
          include: {
            organizer: true,
            category: true,
          },
        },
        buyer: true,
        coupon: true,
      },
    });

    if (existingOrder) {
      return { 
        success: true,
        order: existingOrder,
        sessionId: session.id,
        amount
      };
    }

    // Create new order if doesn't exist
    const newOrder = await db.order.create({
      data: {
        stripeId: session.id,
        eventId,
        buyerId: databaseUserId, // Use the synced database user ID
        totalAmount: amount.toString(),
        quantity: parseInt(quantity) || 1,
        couponId: couponId || undefined,
        discountAmount: discountAmount || undefined,
      },
      include: {
        event: {
          include: {
            organizer: true,
            category: true,
          },
        },
        buyer: true,
        coupon: true,
      },
    });

    console.log("✅ Order created successfully during verification:", newOrder.id);

    return {
      success: true,
      order: newOrder,
      sessionId: session.id,
      amount
    };

  } catch (error: any) {
    console.error("❌ Error verifying order:", error);
    return { 
      success: false,
      message: "Failed to verify order", 
      error: error.message,
      errorType: "verification_error"
    };
  }
}