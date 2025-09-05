"use client";

import React, { useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { Category, Event, User } from "@prisma/client";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { sendTicketEmail } from "@/lib/actions/ticket.action";
import { DeleteConfirmation } from "./deleteConfirmationDialog";

type EventWithRelations = Event & {
  category: Category;
  organizer: User;
  orders?: any[];
};

type CardProps = {
  event: EventWithRelations;
  hasOrderLink?: boolean;
  hidePrice?: boolean;
  eventCreator?: boolean;
  collectionType?: string;
  linkPrefix?: string;
  onDeleteSuccess?: () => void;
};

function Card({
  event,
  hasOrderLink,
  hidePrice,
  eventCreator,
  collectionType,
  linkPrefix = "/events/",
  onDeleteSuccess,
}: CardProps) {
  const { user } = useUser();
  const userId = user?.id;
  const [isSending, setIsSending] = useState<Record<string, boolean>>({});

  const isEventCreator = userId === event.organizerId;
  const userRole = (user?.publicMetadata?.role as string) || "USER"; // Clerk: store role in publicMetadata
  const isAdmin = userRole === "ADMIN";

const handleSendTicket = async (orderId: string) => {
  if (!userId) { // userId here is from useAuth() - it's the Clerk ID
    toast.error("You must be signed in to send tickets.");
    return;
  }

  setIsSending((prev) => ({ ...prev, [orderId]: true }));

  try {
    const result = await sendTicketEmail({
      eventId: event.id,
      orderId: orderId,
      userId: userId, // This is the Clerk user ID
    });

    if (result.success) {
      toast.success(result.message, {
        duration: 4000,
        position: "top-center",
        icon: (
          <img
            src="/assets/icons/green-ticket.png"
            alt="Ticket"
            className="w-6 h-6"
          />
        ),
      });
    } else {
      toast.error(result.message || "Failed to send ticket", {
        duration: 4000,
        position: "top-center",
      });
    }
  } catch (error) {
    console.error("Send ticket error:", error);
    toast.error("Failed to send ticket. Please try again.", {
      duration: 4000,
      position: "top-center",
    });
  } finally {
    setIsSending((prev) => ({ ...prev, [orderId]: false }));
  }
};

  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <Link
        href={`${linkPrefix}/${event.id}/`}
        style={{ backgroundImage: `url(${event.imageUrl})` }}
        className="flex-center flex-grow bg-gray-50 bg-cover bg-center text-grey-500"
      />

      {(isEventCreator || isAdmin || hidePrice) &&
        collectionType !== "All_Events" &&
        collectionType !== "My_Tickets" && (
          <div className="absolute right-2 top-2 flex flex-col gap-4 rounded-xl bg-white p-3 shadow-sm transition-all">
            <Link href={`/admin/events/${event.id}/update`}>
              <Image
                src="/assets/icons/edit.svg"
                alt="edit"
                width={20}
                height={20}
              />
            </Link>

            <DeleteConfirmation
              eventId={event.id}
              onDeleteSuccess={onDeleteSuccess}
            />
          </div>
        )}

      <div className="flex flex-col min-h-[230px] gap-3 p-5 md:gap-4">
        <div className="flex gap-2">
          {!hidePrice && (
            <span className="p-semibold-14 w-min rounded-full bg-green-100 px-4 py-1 text-green-60">
              {event.isFree ? "FREE" : `$${event.price}`}
            </span>
          )}
          <p className="p-semibold-14 w-min rounded-full bg-grey-500/10 px-4 py-1 text-grey-500 line-clamp-1">
            {event?.category?.name}
          </p>
        </div>

        <p className="p-medium-16 p-medium-18 text-grey-500">
          {formatDateTime(event.startDateTime).dateTime}
        </p>

        <Link href={`/events/${event.id}`}>
          <p className="p-medium-16 md:p-medium-20 line-clamp-2 flex-1 text-black">
            {event.title}
          </p>
        </Link>

        <p className="p-medium-14 md:p-medium-16 text-grey-600">
          {event?.organizer?.fullName}
        </p>

        {collectionType === "My_Tickets" &&
          event.orders &&
          event.orders.length > 0 && (
            <div className="mt-4 space-y-2">
              {event.orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleSendTicket(order.id)}
                  disabled={isSending[order.id]}
                  className={`w-full rounded-md px-4 py-2 text-white ${
                    isSending[order.id]
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-primary-500 hover:bg-primary-600"
                  } flex items-center justify-center gap-2`}
                >
                  {isSending[order.id] ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Ticket to Email"
                  )}
                </button>
              ))}
            </div>
          )}

        {hasOrderLink && (
          <div className="mt-auto flex justify-end">
            <Link
              href={`/admin/orders?eventId=${event.id}`}
              className="flex items-center gap-2"
            >
              <p className="text-primary-500">Order Details</p>
              <Image
                src="/assets/icons/arrow.svg"
                alt="search"
                width={10}
                height={10}
              />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Card;
