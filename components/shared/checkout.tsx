"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Event } from "@prisma/client";
import { checkoutOrder } from "@/lib/actions/order.action";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const Checkout = ({ event, userId }: { event: Event; userId?: string }) => {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      console.log("Order placed! You will receive an email confirmation.");
    }
    if (query.get("canceled")) {
      console.log(
        "Order canceled -- continue to shop around and checkout when you're ready."
      );
    }
  }, []);

  const maxTickets = Math.min(5, event.ticketsLeft);
  const ticketOptions = Array.from({ length: maxTickets }, (_, i) => i + 1);

  const onCheckout = async () => {
    if (quantity > event.ticketsLeft) {
      setError(`Only ${event.ticketsLeft} tickets left!`);
      return;
    }

    if (!userId) {
      window.location.href = "/login";
      return;
    }

    setLoading(true); // Start loading

    const order = {
      eventTitle: event.title,
      eventId: event.id,
      price: Number(event.price) * quantity,
      isFree: event.isFree,
      buyerId: userId,
      quantity: quantity,
    };

    try {
      const result = await checkoutOrder(order);
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
      setLoading(false); // Stop loading in case of failure
    }
  };

  const handleBuyNowClick = () => {
    if (!userId) {
      router.push("/login");
    } else {
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Button
          className="button sm:w-fit"
          size="lg"
          onClick={handleBuyNowClick}
        >
          Buy Now
        </Button>

        <AlertDialogContent className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6 border border-gray-300 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select Number of Tickets
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
              {event.isFree
                ? "How many free tickets would you like to reserve?"
                : "How many tickets would you like to purchase?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!event.isFree && (
            <div className="py-4">
              <RadioGroup
                defaultValue="1"
                onValueChange={(value) => setQuantity(parseInt(value))}
                className="flex flex-col space-y-2"
              >
                {ticketOptions.map((num) => (
                  <div
                    key={num}
                    className="flex items-center justify-between space-x-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={num.toString()}
                        id={`ticket-${num}`}
                      />
                      <Label
                        htmlFor={`ticket-${num}`}
                        className="text-gray-900 dark:text-gray-100"
                      >
                        {num} {num === 1 ? "Ticket" : "Tickets"}
                      </Label>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      ${Number(event.price) * num}
                    </span>
                  </div>
                ))}
              </RadioGroup>

              <div className="mt-4 p-3 bg-gray-200 dark:bg-gray-700 rounded-md">
                <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100">
                  <span>Total:</span>
                  <span>${Number(event.price) * quantity}</span>
                </div>
              </div>
            </div>
          )}

          {event.isFree && (
            <div className="py-4">
              <RadioGroup
                defaultValue="1"
                onValueChange={(value) => setQuantity(parseInt(value))}
                className="flex flex-col space-y-2"
              >
                {ticketOptions.map((num) => (
                  <div
                    key={num}
                    className="flex items-center space-x-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <RadioGroupItem
                      value={num.toString()}
                      id={`ticket-${num}`}
                    />
                    <Label
                      htmlFor={`ticket-${num}`}
                      className="text-gray-900 dark:text-gray-100"
                    >
                      {num} {num === 1 ? "Ticket" : "Tickets"}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {error && (
            <div className="mt-2 p-3 bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={loading}
              className="text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={onCheckout}
              disabled={loading}
            >
              {loading ? "Processing..." : "Buy Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Checkout;
