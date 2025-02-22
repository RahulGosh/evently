import Stripe from "stripe"
import { CheckoutOrderParams, CreateOrderParams } from "@/types";
import { db } from "../db";

export const checkoutOrder = async (order: CheckoutOrderParams) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const price = order.isFree ? 0 : Number(order.price) * 100;

    try {
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        unit_amount: price,
                        product_data: {
                            name: order.eventTitle,
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                eventId: order.eventId,
                buyerId: order.buyerId,
            },
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile`,
            cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/`,
        });

        return { url: session.url };
    } catch (error) {
        throw error
    }
};

export const createOrder = async (order: CreateOrderParams) => {
    try {
        const newOrder = await db.order.create({
            data: {
                stripeId: order.stripeId,
                totalAmount: order.totalAmount,
                event: { connect: { id: order.eventId } },
                buyer: { connect: { id: order.buyerId } },
            },
        });

        return newOrder;
    } catch (error) {
        throw error;
    }
};
