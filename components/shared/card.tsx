"use client";

import React from "react";
import { Event, Category, User } from "@prisma/client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { formatDateTime } from "@/lib/utils";
import { DeleteConfirmation } from "./deleteConfirmationDialog";

// Utility function for formatting date (assuming it's already implemented)

type EventWithRelations = Event & {
  category: Category;
  organizer: User;
};

type CardProps = {
  event: EventWithRelations;
  hasOrderLink?: boolean;
  hidePrice?: boolean;
  eventCreator?: boolean;
};

function Card({ event, hasOrderLink, hidePrice, eventCreator }: CardProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const isEventCreator = userId === event.organizer.id.toString();

  const userRole = session?.user?.role; // Directly use the role without type assertion
  const isAdmin = userRole === "ADMIN";

  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <Link
        href={`/protected/events/${event.id}`}
        style={{ backgroundImage: `url(${event.imageUrl})` }}
        className="flex-center flex-grow bg-gray-50 bg-cover bg-center text-grey-500"
      />
      {/* IS EVENT CREATOR ... */}

      {isEventCreator && !hidePrice && isAdmin && (
        <div className="absolute right-2 top-2 flex flex-col gap-4 rounded-xl bg-white p-3 shadow-sm transition-all">
          <Link href={`/protected/events/${event.id}/update`}>
            <Image
              src="/assets/icons/edit.svg"
              alt="edit"
              width={20}
              height={20}
            />
          </Link>

          {isAdmin && <DeleteConfirmation eventId={event.id} />}
        </div>
      )}

      <div className="flex min-h-[230px] flex-col gap-3 p-5 md:gap-4">
        {!hidePrice && (
          <div className="flex gap-2">
            <span className="p-semibold-14 w-min rounded-full bg-green-100 px-4 py-1 text-green-60">
              {event.isFree ? "FREE" : `$${event.price}`}
            </span>
            <p className="p-semibold-14 w-min rounded-full bg-grey-500/10 px-4 py-1 text-grey-500 line-clamp-1">
              {event.category.name}
            </p>
          </div>
        )}

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
            {event.organizer.name}
          </p>

          {hasOrderLink && (
            <Link href={`/orders?eventId=${event.id}`} className="flex gap-2">
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
