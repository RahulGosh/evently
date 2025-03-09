"use client";

import { formatDateTime } from "@/lib/utils";
import { Category, Event, User } from "@prisma/client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { DeleteConfirmation } from "./deleteConfirmationDialog";

type EventWithRelations = Event & {
  category: Category;
  organizer: User;
};

type CardProps = {
  event: EventWithRelations;
  hasOrderLink?: boolean;
  hidePrice?: boolean;
  eventCreator?: boolean;
  collectionType?: string;
};

function Card({
  event,
  hasOrderLink,
  hidePrice,
  eventCreator,
  collectionType,
}: CardProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const isEventCreator = userId === event.organizerId.toString();

  const userRole = session?.user?.role; // Directly use the role without type assertion
  const isAdmin = userRole === "ADMIN";

  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <Link
        href={`/events/${event.id}`}
        style={{ backgroundImage: `url(${event.imageUrl})` }}
        className="flex-center flex-grow bg-gray-50 bg-cover bg-center text-grey-500"
      />
      {/* IS EVENT CREATOR ... */}

      {/* IS EVENT CREATOR ... */}
      {(isEventCreator || isAdmin || hidePrice) &&
        collectionType !== "All_Events" &&
        collectionType !== "My_Tickets" && ( // Exclude My_Tickets collection
          <div className="absolute right-2 top-2 flex flex-col gap-4 rounded-xl bg-white p-3 shadow-sm transition-all">
            <Link href={`/protected/admin/events/${event.id}/update`}>
              <Image
                src="/assets/icons/edit.svg"
                alt="edit"
                width={20}
                height={20}
              />
            </Link>

            <DeleteConfirmation eventId={event.id} />
          </div>
        )}

      <div className="flex min-h-[230px] flex-col gap-3 p-5 md:gap-4">
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

        <div className="flex-between w-full">
          <p className="p-medium-14 md:p-medium-16 text-grey-600">
            {event?.organizer?.name}
          </p>

          {hasOrderLink && (
            <Link
              href={`/protected/admin/orders?eventId=${event.id}`}
              className="flex gap-2"
            >
              <p className="text-primary-500">Order Details</p>
              <Image
                src="/assets/icons/arrow.svg"
                alt="search"
                width={10}
                height={10}
              />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Card;
