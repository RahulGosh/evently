// app/api/webhook/stripe/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/actions/order.action';
import { syncUser } from '@/lib/actions/user.action';

export const dynamic = 'force-dynamic';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

const stripe = new Stripe(stripeSecretKey);

export async function POST(request: Request) {
  console.log("🔹 Webhook triggered");

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    console.error("❌ Missing Stripe signature or webhook secret.");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    console.log("✅ Webhook verified. Event type:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json({ message: "Webhook error", error: err }, { status: 400 });
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("✅ Payment successful. Session ID:", session.id);

    // Validate required metadata
    if (!session.metadata) {
      console.error("❌ Metadata is missing in session");
      return NextResponse.json({ message: "Invalid session data" }, { status: 400 });
    }

    const { eventId, buyerId, quantity, couponId, discountAmount } = session.metadata;

    if (!eventId || !buyerId) {
      console.error("❌ Missing required metadata:", { eventId, buyerId });
      return NextResponse.json({ 
        message: "Missing required event or buyer information" 
      }, { status: 400 });
    }

    try {
      // Sync user to database first
      console.log("🔄 Syncing user to database:", buyerId);
      const user = await syncUser(buyerId);
      
      if (!user) {
        throw new Error("Failed to sync user to database");
      }

      const totalAmount = session.amount_total ? (session.amount_total / 100).toString() : '0';
      
      const order = {
        stripeId: session.id,
        eventId,
        buyerId: user.id, // Use the database user ID, not Clerk ID
        totalAmount,
        quantity: parseInt(quantity || '1', 10),
        couponId: couponId || undefined,
        discountAmount: discountAmount || '0',
      };

      console.log("📦 Creating order with data:", order);

      // Create the order
      const newOrder = await createOrder(order);
      console.log("✅ Order created successfully:", newOrder.id);

      return NextResponse.json({ 
        message: 'Order created successfully', 
        orderId: newOrder.id 
      });

    } catch (error: any) {
      console.error("❌ Error creating order:", error);
      
      if (error.message.includes("tickets available")) {
        console.error("❌ Ticket availability issue");
        // Consider initiating a refund here
      }
      
      return NextResponse.json({ 
        message: "Database error", 
        error: error.message 
      }, { status: 500 });
    }
  }

  // For other event types, just acknowledge
  return NextResponse.json({ message: 'Event received' });
}