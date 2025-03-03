"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";
import Checkout from "./checkout";
import { Event } from "@prisma/client";

// Exclude relations like 'orders' from Event
type EventProps = Omit<Event, "orders">;

const CheckoutButton = ({ event }: { event: EventProps }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;

  const hasEventFinished = new Date(event.endDateTime) < new Date();

  if (hasEventFinished) {
    return (
      <p className="p-2 text-red-400">Sorry, tickets are no longer available.</p>
    );
  }

  const handleCheckout = () => {
    if (!userId) {
      router.push("/login");
    }
  };

  return (
    <div className="flex items-center gap-3">
      {userId ? (
        <Checkout event={event} userId={userId} />
      ) : (
        <Button 
        onClick={() => router.push("/login")} 
        className="button sm:w-fit" 
          size="lg"
        >
          {event.isFree ? "Get Ticket" : "Buy Now"}
        </Button>
      )}
    </div>
  );
};

export default CheckoutButton;
