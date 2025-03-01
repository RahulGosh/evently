import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/actions/order.action'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
})

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') as string
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!
  console.log("🔔 Webhook received"); // Debugging Log
  console.log(endpointSecret, "endpointsecret")
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    console.log("✅ Webhook verified:", event.type); // Log event type

  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ message: 'Webhook error', error: err }, { status: 400 })
  }

  // Extract event type
  const eventType = event.type

  if (eventType === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const order = {
      stripeId: session.id,
      eventId: session.metadata?.eventId || '',
      buyerId: session.metadata?.buyerId || '',
      totalAmount: session.amount_total ? (session.amount_total / 100).toString() : '0',
      quantity: session.metadata?.quantity ? parseInt(session.metadata.quantity, 10) : 1,
      createdAt: new Date(),
    }

    if (!session.metadata?.eventId || !session.metadata?.buyerId) {
      console.error("Missing metadata:", session.metadata);
      return NextResponse.json({ message: "Missing metadata" }, { status: 400 });
    }

    try {
      const newOrder = await createOrder(order)
      return NextResponse.json({ message: 'OK', order: newOrder })
    } catch (err) {
      console.error('Error creating order:', err)
      return NextResponse.json({ message: 'Database error', error: err }, { status: 500 })
    }
  }

  return new Response('', { status: 200 })
}
