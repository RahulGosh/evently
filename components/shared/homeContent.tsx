import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image";
import Search from "./search";
import Collection from "./collection";
import CountdownTimer from "./countdownTimer";
import CategoryFilter from "./categoryFilter";
import { getAllEvents, getNextUpcomingEvent } from "@/lib/actions/event.action";
import { currentUser } from "@clerk/nextjs/server";
 
type HomeContentProps = {
  page: number;
  searchText: string;
  category: string;
};

export async function HomeContent({ page, searchText, category }: HomeContentProps) {
    const user = await currentUser();
    console.log(user?.publicMetadata, "")

  const [eventsData, nextEvent] = await Promise.all([
    getAllEvents({
      query: searchText,
      category,
      limit: 6,
      page,
    }),
    getNextUpcomingEvent().catch(() => null) // Gracefully handle if no upcoming event
  ]);
  console.log(eventsData, "eventsData")
  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-contain py-5 md:py-10">
        <div className="wrapper grid grid-cols-1 gap-5 md:grid-cols-2 2xl:gap-0">
          <div className="flex flex-col justify-center gap-8">
            <h1 className="h1-bold">
              Host, Connect, Celebrate: Your Events, Our Platform!
            </h1>
            <p className="p-regular-20 md:p-regular-24">
              Book and learn helpful tips from 3,168+ mentors in world-class
              companies with our global community.
            </p>
            <Button size="lg" asChild className="button w-full sm:w-fit">
              <Link href="#events">Explore Now</Link>
            </Button>
          </div>

          <Image
            src="/assets/images/hero.png"
            alt="hero"
            width={1000}
            height={1000}
            className="max-h-[70vh] object-contain object-center 2xl:max-h-[50vh]"
          />
        </div>
      </section>

      {/* Add the countdown section */}
      {nextEvent && (
        <section className="wrapper my-8">
          <CountdownTimer 
            targetDate={new Date(nextEvent.startDateTime)} 
            eventTitle={nextEvent.title}
          />
        </section>
      )}

      <section
        id="events"
        className="wrapper my-8 flex flex-col gap-8 md:gap-12"
      >
        <h2 className="h2-bold">
          Trusted by <br /> Thousands of Events
        </h2>

        <form action="/" method="GET" className="flex w-full flex-col gap-5 md:flex-row items-center">
          <Search />
          <CategoryFilter />
          {/* <ClearFiltersButton /> */}
        </form>

        <Collection
          data={eventsData?.data}
          emptyTitle="No Events Found"
          emptyStateSubtext="Come back later"
          collectionType="All_Events"
          limit={6}
          page={page}
          totalPages={eventsData?.totalPages}
        />
      </section>
    </>
  );
}