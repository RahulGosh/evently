import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Event } from "@prisma/client";
import { checkoutOrder } from "@/lib/actions/order.action";
import { loadStripe } from "@stripe/stripe-js";
import { AlertCircle } from "lucide-react";

loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const Checkout = ({ event, userId }: { event: Event; userId: string }) => {
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      console.log("Order placed! You will receive an email confirmation.");
    }
    if (query.get("canceled")) {
      console.log("Order canceled -- continue to shop around and checkout when you’re ready.");
    }
  }, []);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      setQuantity(value);
      return;
    }

    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue) || parsedValue < 1) {
      setQuantity("1");
    } else if (parsedValue > Math.min(5, event.ticketsLeft)) {
      setQuantity(Math.min(5, event.ticketsLeft).toString());
      setError("You can select up to 5 tickets per order.");
    } else {
      setQuantity(value);
      setError(null);
    }
  };

  const handleBlur = () => {
    if (quantity === "") {
      setQuantity("1");
    }
  };

  const onCheckout = async () => {
    const finalQuantity = parseInt(quantity, 10) || 1;

    if (finalQuantity > event.ticketsLeft) {
      setError(`Only ${event.ticketsLeft} tickets left!`);
      return;
    }

    const order = {
      eventTitle: event.title,
      eventId: event.id,
      price: Number(event.price) * finalQuantity,
      isFree: event.isFree,
      buyerId: userId,
      quantity: finalQuantity,
    };

    const result = await checkoutOrder(order);
    if (result?.url) {
      window.location.href = result.url;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-gray-300 rounded-lg shadow-md bg-white max-w-md">
      {!event.isFree && (
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Select Quantity</label>
          <Input
            type="number"
            value={quantity}
            onChange={handleQuantityChange}
            onBlur={handleBlur}
            min="1"
            max={Math.min(5, event.ticketsLeft)}
            className="w-full p-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-indigo-500"
          />
          {error && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          <p className="text-sm font-medium text-gray-700 mt-2">
            Total: <span className="font-bold">${Number(event.price) * (parseInt(quantity, 10) || 1)}</span>
          </p>
        </div>
      )}
      <Button
        onClick={onCheckout}
        disabled={!!error}
        size="lg"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 disabled:bg-gray-400"
      >
        {event.isFree ? "Get Ticket" : `Buy Ticket`}
      </Button>
    </div>
  );
};

export default Checkout;
