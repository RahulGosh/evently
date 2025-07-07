import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session_id = searchParams.get("session_id");

  if (!session_id) {
    return NextResponse.json(
      { success: false, message: "Session ID is required" },
      { status: 400 }
    );
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(
      session_id,
      {
        expand: ["payment_intent"],
      }
    );

    // Check if payment was successful
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, message: "Payment was not successful" },
        { status: 200 }
      );
    }

    // Find the order in database
    const order = await db.order.findFirst({
      where: { stripeId: session.id },
      include: {
        event: {
          select: {
            title: true,
            description: true,
            startDateTime: true,
            endDateTime: true,
            location: true,
            imageUrl: true,
            url: true,
            organizer: {
              select: {
                name: true,
              },
            },
          },
        },
        coupon: {
          select: {
            code: true,
            discount: true,
            isPercentage: true,
          },
        },
      },
    });

    // Return order data if found
    if (order) {
      return NextResponse.json({ 
        success: true,
        order
      });
    }

    // If we have a paid session but no order, return the session for pending display
    return NextResponse.json({ 
      success: true,
      session
    });
  } catch (error: any) {
    console.error("Error verifying order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify order", error: error.message },
      { status: 500 }
    );
  }
}