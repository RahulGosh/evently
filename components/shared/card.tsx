"use client";

import React from "react";
import { formatDateTime } from "@/lib/utils";
import { Category, Event, User } from "@prisma/client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { DeleteConfirmation } from "./deleteConfirmationDialog";
import DownloadTicket from "./downloadTicket";

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
  onDeleteSuccess?: () => void; // ✅ Add type for onDeleteSuccess
};

function Card({
  event,
  hasOrderLink,
  hidePrice,
  eventCreator,
  collectionType,
  linkPrefix = "/events/", // Default path
  onDeleteSuccess, // ✅ Pass down refetch function
}: CardProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const isEventCreator = userId === event.organizerId.toString();
  const userRole = session?.user?.role;
  const isAdmin = userRole === "ADMIN";

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
            <Link href={`/protected/admin/events/${event.id}/update`}>
              <Image
                src="/assets/icons/edit.svg"
                alt="edit"
                width={20}
                height={20}
              />
            </Link>

            <DeleteConfirmation eventId={event.id} onDeleteSuccess={onDeleteSuccess} />
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
          {event?.organizer?.name}
        </p>

        {collectionType === "My_Tickets" &&
          event.orders &&
          event.orders.length > 0 && (
            <div className="mt-4 space-y-2">
              {event.orders.map((order) => (
                <DownloadTicket key={order.id} event={event} order={order} />
              ))}
            </div>
          )}

        {/* Order Details at the Bottom */}
        {hasOrderLink && (
          <div className="mt-auto flex justify-end">
            <Link
              href={`/protected/admin/orders?eventId=${event.id}`}
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
