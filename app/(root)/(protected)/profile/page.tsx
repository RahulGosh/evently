"use client";

import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { getEventsByUser } from "@/lib/actions/event.action";
import { getOrdersByUser } from "@/lib/actions/order.action";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Collection from "@/components/shared/collection";
import LoadingLogoForProfile from "@/components/shared/loadingLogoForProfile";
import { useAuth } from "@clerk/nextjs";

// Inner component that uses useSearchParams
function ProfileContentInner() {
  const { userId: clerkId, isSignedIn } = useAuth();
  const searchParams = useSearchParams();

  const ordersPage = Number(searchParams.get("ordersPage")) || 1;
  const eventsPage = Number(searchParams.get("eventsPage")) || 1;

  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [orderedEvents, setOrderedEvents] = useState<any>(null);
  const [organizedEvents, setOrganizedEvents] = useState<any>(null);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [eventsTotalPages, setEventsTotalPages] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // ✅ Translate Clerk ID → DB user.id
  useEffect(() => {
    const syncUser = async () => {
      if (!clerkId) return;
      try {
        const res = await fetch("/api/sync-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerkUserId: clerkId }),
        });
        const data = await res.json();
        if (data.success) {
          setDbUserId(data.userId); // ✅ store DB userId
        }
      } catch (error) {
        console.error("Error syncing user:", error);
      }
    };
    syncUser();
  }, [clerkId]);

  const fetchEvents = async () => {
    if (!dbUserId) return;
    setLoadingEvents(true);
    try {
      const events = await getEventsByUser(dbUserId, { page: eventsPage });
      setOrganizedEvents(events?.data || []);
      setEventsTotalPages(events?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchOrders = async () => {
    if (!dbUserId) return;
    setLoadingOrders(true);
    try {
      const orders = await getOrdersByUser({ userId: dbUserId, page: ordersPage });
      const currentDate = new Date();
      const eventsWithOrders =
        orders?.data
          ?.map((order: any) => ({
            ...order.event,
            orders: [order],
          }))
          ?.filter((event: any) => new Date(event.endDateTime) >= currentDate) || [];
      setOrderedEvents(eventsWithOrders);
      setOrdersTotalPages(orders?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isSignedIn && dbUserId) {
      fetchOrders();
      fetchEvents();
    }
  }, [isSignedIn, dbUserId, ordersPage, eventsPage]);

  if (!isSignedIn) {
    return (
      <div className="text-center py-20">
        <p className="mb-4">You must be signed in to view your profile.</p>
        <Link href="/sign-in">
          <Button size="lg">Sign In</Button>
        </Link>
      </div>
    );
  }

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

      {/* Admin Events Organized Section */}
      {true && (
        <>
          <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
            <div className="wrapper flex items-center justify-center sm:justify-between">
              <h3 className="h3-bold text-center sm:text-left">Events Organized</h3>
              <Button asChild size="lg" className="button hidden sm:flex">
                <Link href="/protected/admin/events/create">
                  Create New Event
                </Link>
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
                onDeleteSuccess={fetchEvents}
              />
            )}
          </section>
        </>
      )}

    </>
  );
}

// Main component that wraps with Suspense
const ProfileContent = () => {
  return (
    <Suspense fallback={<LoadingLogoForProfile />}>
      <ProfileContentInner />
    </Suspense>
  );
};

export default ProfileContent;