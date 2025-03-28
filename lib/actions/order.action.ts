"use server";

import Stripe from "stripe";
import {
  CheckoutOrderParams,
  CreateOrderParams,
  GetOrdersByEventParams,
  GetOrdersByUserParams,
} from "@/types";
import { db } from "@/lib/db";

export const checkoutOrder = async (order: CheckoutOrderParams) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY);

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key is missing. Check your .env file.");
  }

  const price = order.isFree ? 0 : (Number(order.price) / order.quantity) * 100; // Ensure it's in paise
  try {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "inr",
          unit_amount: price,
          product_data: {
            name: order.eventTitle,
          },
        },
        quantity: order.quantity, // Use quantity here
      },
    ],
    metadata: {
      eventId: order.eventId,
      buyerId: order.buyerId,
      quantity: order.quantity, // Store it in metadata
    },
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/protected/profile`,
    cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/`,
  });
  console.log("Stripe Checkout URL:", session.url);
  console.log(order.eventId, "order.eventId")
  console.log(order.buyerId, "order.buyerId")
  console.log(order.quantity, "order.quantity")
  console.log(session, "session")
  return { url: session.url };
} catch (error) {
  throw error;
}
}

export const createOrder = async (order: CreateOrderParams) => {
  try {
    const event = await db.event.findUnique({
      where: { id: order.eventId },
      select: { ticketsLeft: true },
    });
    console.log(event, "event")
    if (!event) {
      throw new Error("Event not found.");
    }

    if (event.ticketsLeft <= 0) {
      throw new Error("No tickets available for this event.");
    }

    const newOrder = await db.$transaction(async (prisma) => {
      const updatedEvent = await prisma.event.update({
        where: { id: order.eventId },
        data: { ticketsLeft: { decrement: order.quantity } }, // Use quantity
      });
    
      if (updatedEvent.ticketsLeft < 0) {
        throw new Error("Not enough tickets available.");
      }
    
      const createdOrder = await prisma.order.create({
        data: {
          stripeId: order.stripeId,
          totalAmount: order.totalAmount,
          quantity: order.quantity, // Store quantity in DB
          event: { connect: { id: order.eventId } },
          buyer: { connect: { id: order.buyerId } },
        },
      });
    
      console.log(createdOrder, "newOrder"); // ✅ Now we log after order creation
      return createdOrder;
    });
    
  } catch (error) {
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
      },
      orderBy: { createdAt: sort },
    });

    return orders.map((order) => ({
      _id: order.id,
      totalAmount: order.totalAmount,
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

// DELETE FROM "orders" WHERE "buyerId" = '3212312312312';
// DELETE FROM "events" WHERE "organizerId" = '3212312312312';
// DELETE FROM "users" WHERE "id" = '3212312312312';