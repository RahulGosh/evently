"use client";

import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getEventsByUser } from "@/lib/actions/event.action";
import { getOrdersByUser } from "@/lib/actions/order.action";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Collection from "@/components/shared/collection";
import LoadingLogo from "@/components/shared/loadingLogo";
import LoadingLogoForProfile from "@/components/shared/loadingLogoForProfile";

const ProfileContent = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id as string;
  const searchParams = useSearchParams();

  const ordersPage = Number(searchParams.get("ordersPage")) || 1;
  const eventsPage = Number(searchParams.get("eventsPage")) || 1;

  const [orderedEvents, setOrderedEvents] = useState<any>(null);
  const [organizedEvents, setOrganizedEvents] = useState<any>(null);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [eventsTotalPages, setEventsTotalPages] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) return;
      setLoadingOrders(true);

      try {
        const orders = await getOrdersByUser({ userId, page: ordersPage });

        setOrderedEvents(orders?.data.map((order: any) => order.event) || []);
        setOrdersTotalPages(orders?.totalPages || 1);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    };

    const fetchEvents = async () => {
      if (!userId) return;
      setLoadingEvents(true);

      try {
        const events = await getEventsByUser(userId, { page: eventsPage });

        setOrganizedEvents(events?.data || []);
        setEventsTotalPages(events?.totalPages || 1);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchOrders();
    fetchEvents();
  }, [userId, ordersPage, eventsPage]);

  return (
    <>
      {/* My Tickets Section */}
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper flex items-center justify-center sm:justify-between">
          <h3 className="h3-bold text-center sm:text-left">My Tickets</h3>
          <Button asChild size="lg" className="button hidden sm:flex">
            <Link href="/#events">Explore More Events</Link>
          </Button>
        </div>
      </section>

      <section className="wrapper my-8">
        {loadingOrders ? (
          <LoadingLogoForProfile />
        ) : (
          <Collection
            data={orderedEvents}
            emptyTitle="No event tickets purchased yet"
            emptyStateSubtext="No worries - plenty of exciting events to explore!"
            collectionType="My_Tickets"
            limit={6}
            page={ordersPage}
            urlParamName="ordersPage"
            totalPages={ordersTotalPages}
          />
        )}
      </section>

      {session?.user?.isAdmin && (
        <>
          {/* Events Organized Section */}
          <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
            <div className="wrapper flex items-center justify-center sm:justify-between">
              <h3 className="h3-bold text-center sm:text-left">
                Events Organized
              </h3>
              <Button asChild size="lg" className="button hidden sm:flex">
                <Link href="/protected/admin/events/create">Create New Event</Link>
              </Button>
            </div>
          </section>

          <section className="wrapper my-8">
            {loadingEvents ? (
              <LoadingLogoForProfile />
            ) : (
              <Collection
                data={organizedEvents}
                emptyTitle="No events have been created yet"
                emptyStateSubtext="Go create some now"
                collectionType="Events_Organized"
                limit={6}
                page={eventsPage}
                urlParamName="eventsPage"
                totalPages={eventsTotalPages}
              />
            )}
          </section>
        </>
      )}
    </>
  );
};

const ProfilePage = () => {
  return (
    <Suspense fallback={<LoadingLogo />}>
      <ProfileContent />
    </Suspense>
  );
};

export default ProfilePage;
