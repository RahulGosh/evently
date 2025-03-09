import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/actions/order.action';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  console.log("🔹 Webhook triggered");

  // Read the raw body for signature verification
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    console.error("❌ Missing Stripe signature or webhook secret.");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  console.log("🔹 Webhook signature received:", sig);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    console.log("✅ Webhook verified. Event type:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json({ message: "Webhook error", error: err }, { status: 400 });
  }

  // Extract event type
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("✅ Payment successful. Session data:", session);

    // Ensure metadata exists to avoid undefined errors
    if (!session.metadata) {
      console.error("❌ Metadata is missing in session:", session);
      return NextResponse.json({ message: "Invalid session data" }, { status: 400 });
    }

    const order = {
      stripeId: session.id,
      eventId: session.metadata.eventId || '',
      buyerId: session.metadata.buyerId || '',
      totalAmount: session.amount_total ? (session.amount_total / 100).toString() : '0',
      quantity: session.metadata.quantity ? parseInt(session.metadata.quantity, 10) : 1,
      createdAt: new Date(),
    };

    console.log("📦 Creating order:", order);

    try {
      const newOrder = await createOrder(order);
      console.log("✅ Order created successfully:", newOrder);
      return NextResponse.json({ message: 'OK', order: newOrder });
    } catch (err) {
      console.error("❌ Error creating order:", err);
      return NextResponse.json({ message: "Database error", error: err }, { status: 500 });
    }
  } else {
    console.log("ℹ️ Unhandled event type:", event.type);
  }

  return new Response('', { status: 200 });
}
