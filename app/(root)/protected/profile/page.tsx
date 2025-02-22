import { Button } from '@/components/ui/button';
import { getEventsByUser } from '@/lib/actions/event.action';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import React from 'react';

const ProfilePage = async (props: { searchParams: Promise<{ ordersPage?: string; eventsPage?: string }> }) => {
    const searchParams = await props.searchParams;

    const { data: session } = useSession();
    const userId = session?.user?.id as string;

    // Convert query parameters safely
    const ordersPage = Number(searchParams?.ordersPage) || 1;
    const eventsPage = Number(searchParams?.eventsPage) || 1;

    // Fetch events organized by the user
    const organizedEvents = await getEventsByUser(userId, { page: eventsPage });

    return (
        <>
            {/* My Tickets */}
            <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
                <div className="wrapper flex items-center justify-center sm:justify-between">
                    <h3 className="h3-bold text-center sm:text-left">My Tickets</h3>
                    <Button asChild size="lg" className="button hidden sm:flex">
                        <Link href="/#events">
                            Explore More Events
                        </Link>
                    </Button>
                </div>
            </section>

            <section className="wrapper my-8">
                {/* Ordered events section can be added here when needed */}
            </section>

            {/* Events Organized */}
            <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
                <div className="wrapper flex items-center justify-center sm:justify-between">
                    <h3 className="h3-bold text-center sm:text-left">Events Organized</h3>
                    <Button asChild size="lg" className="button hidden sm:flex">
                        <Link href="/events/create">
                            Create New Event
                        </Link>
                    </Button>
                </div>
            </section>

            <section className="wrapper my-8">
                {/* <Collection
                    data={organizedEvents?.data}
                    emptyTitle="No events have been created yet"
                    emptyStateSubtext="Go create some now"
                    collectionType="Events_Organized"
                    limit={3}
                    page={eventsPage}
                    urlParamName="eventsPage"
                    totalPages={organizedEvents?.totalPages}
                /> */}
            </section>
        </>
    );
};

export default ProfilePage;
