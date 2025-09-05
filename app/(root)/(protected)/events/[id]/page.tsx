import CheckoutButton from "@/components/shared/checkoutButton";
import Collection from "@/components/shared/collection";
import {
  getEventById,
  getRelatedEventsByCategory,
} from "@/lib/actions/event.action";
import { formatDateTime } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";

export default async function EventDetails(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; query?: string; category?: string }>;
}) {
  
  const params = await props.params;
  const searchParams = await props.searchParams;

  const { userId } = await auth();

  if (!params?.id) {
    return <p className="text-center text-red-500">Invalid event ID.</p>;
  }

  const event = await getEventById(params.id);
  if (!event) {
    return <p className="text-center text-gray-500">Event not found.</p>;
  }

  const relatedEvents = await getRelatedEventsByCategory({
    categoryId: event.category.id,
    eventId: event.id,
    page: searchParams?.page ? Number(searchParams.page) : 1,
  });

  return (
    <>
      <section className="flex justify-center bg-primary-50 bg-dotted-pattern bg-contain">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:max-w-7xl">
          <Image
            src={event.imageUrl}
            alt="Event Image"
            width={1000}
            height={1000}
            className="h-full min-h-[300px] object-cover object-center"
          />

          <div className="flex w-full flex-col gap-8 p-5 md:p-10">
            <div className="flex flex-col gap-6">
              <h2 className="h2-bold">{event.title}</h2>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex gap-3">
                  <p className="p-bold-20 rounded-full bg-green-500/10 px-5 py-2 text-green-700">
                    {event.isFree ? "FREE" : `$${event.price}`}
                  </p>
                  <p className="p-medium-16 rounded-full bg-grey-500/10 px-4 py-2.5 text-grey-500">
                    {event.category.name}
                  </p>
                </div>

                <p className="p-medium-18 ml-2 mt-2 sm:mt-0">
                  by{" "}
                  <span className="text-primary-500">
                    {event.organizer.fullName}
                  </span>
                </p>
              </div>
            </div>

            {event.ticketsLeft > 0 && (
              <CheckoutButton event={event} userId={userId} />
            )}

            <div className="flex items-center gap-2">
              <Image
                src="/assets/icons/ticket.png"
                alt="Tickets Left"
                width={28}
                height={28}
              />
              <p className="p-medium-16 lg:p-regular-20 text-red-600">
                {event.ticketsLeft > 0 ? (
                  <>{event.ticketsLeft} tickets left</>
                ) : (
                  <span className="text-red-500 font-semibold">Sold Out</span>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex gap-2 md:gap-3">
                <Image
                  src="/assets/icons/calendar.svg"
                  alt="Calendar"
                  width={32}
                  height={32}
                />

                <div className="flex flex-col">
                  {/* Start Date & Time */}
                  <div className="p-medium-16 lg:p-regular-20 flex items-center">
                    <p className="font-semibold">Start:</p>
                    <p className="ml-2">
                      {formatDateTime(event.startDateTime).dateOnly} -{" "}
                      {formatDateTime(event.startDateTime).timeOnly}
                    </p>
                  </div>

                  {/* End Date & Time */}
                  <div className="p-medium-16 lg:p-regular-20 flex items-center">
                    <p className="font-semibold">End:</p>
                    <p className="ml-2">
                      {formatDateTime(event.endDateTime).dateOnly} -{" "}
                      {formatDateTime(event.endDateTime).timeOnly}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-regular-20 flex items-center gap-3">
                <Image
                  src="/assets/icons/location.svg"
                  alt="Location"
                  width={32}
                  height={32}
                />
                <p className="p-medium-16 lg:p-regular-20">{event.location}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="p-bold-20 text-grey-600">What You'll Learn:</p>
              <p className="p-medium-16 lg:p-regular-18">{event.description}</p>
              <p className="p-medium-16 lg:p-regular-18 truncate text-primary-500 underline">
                {event.url}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS with the same category */}
      <section className="wrapper my-8 flex flex-col gap-8 md:gap-12">
        <h2 className="h2-bold">Related Events</h2>

        <Collection
          data={relatedEvents?.data}
          emptyTitle="No Events Found"
          emptyStateSubtext="Come back later"
          collectionType="All_Events"
          limit={3}
          page={searchParams?.page || "1"}
          totalPages={relatedEvents?.totalPages}
        />
      </section>
    </>
  );
}
