"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Event } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import Checkout from "./checkout";

type EventProps = Omit<Event, "orders">;

const CheckoutButton = ({
  event,
  userId,
}: {
  event: EventProps;
  userId: string | null;
}) => {
  const router = useRouter();
  const hasEventFinished = new Date(event.endDateTime) < new Date();

  if (hasEventFinished) {
    return (
      <p className="p-2 text-red-400">
        Sorry, tickets are no longer available.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {userId ? (
        <Checkout event={event} userId={userId} />
      ) : (
        <Button
          onClick={() => router.push("/sign-in")}
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
