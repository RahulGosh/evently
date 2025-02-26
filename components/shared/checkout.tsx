import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Event } from "@prisma/client";
import { checkoutOrder } from "@/lib/actions/order.action";
import { loadStripe } from "@stripe/stripe-js";

loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const Checkout = ({ event, userId }: { event: Event; userId: string }) => {
  const [quantity, setQuantity] = useState("1"); // Store as a string for better input handling
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if redirected from Checkout
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
      setQuantity(value); // Allow empty input
      return;
    }

    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue) || parsedValue < 1) {
      setQuantity("1"); // Default to 1 if input is invalid
    } else if (parsedValue > event.ticketsLeft) {
      setQuantity(event.ticketsLeft.toString()); // Limit to max available
      setError(`Only ${event.ticketsLeft} tickets left!`);
    } else {
      setQuantity(value);
      setError(null);
    }
  };

  const handleBlur = () => {
    if (quantity === "") {
      setQuantity("1"); // Reset to 1 if left empty
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
      price: Number(event.price) * finalQuantity, // ✅ Multiply by quantity
      isFree: event.isFree,
      buyerId: userId,
      quantity: finalQuantity, // ✅ Pass quantity
    };
  
    const result = await checkoutOrder(order);
    if (result?.url) {
      window.location.href = result.url;
    }
  };

  return (
    <div className="flex items-center gap-3">
      {!event.isFree && (
        <div className="flex flex-col">
          <Input
            type="number"
            value={quantity}
            onChange={handleQuantityChange}
            onBlur={handleBlur}
            min="1"
            max={event.ticketsLeft}
            className="w-20 p-2 border border-gray-300 rounded-md text-center"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <p className="text-sm font-medium mt-1">
            Total: ${Number(event.price) * (parseInt(quantity, 10) || 1)}
          </p>
        </div>
      )}
      <Button
        onClick={onCheckout}
        disabled={!!error}
        size="lg"
        className="button sm:w-fit"
      >
        {event.isFree ? "Get Ticket" : `Buy Ticket`}
      </Button>
    </div>
  );
};

export default Checkout;
