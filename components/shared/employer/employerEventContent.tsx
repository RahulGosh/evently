import React from 'react'
import { getAllEvents } from '@/lib/actions/event.action';
import Search from '@/components/shared/search';
import CategoryFilter from '@/components/shared/categoryFilter';
import Collection from '@/components/shared/collection';
import { ClearFiltersButton } from './clearFilterButton';

type EmployerProps = {
    page: number;
    searchText: string;
    category: string;
  };

  export async function EmployerEventsContent({ page, searchText, category }: EmployerProps) {
    const eventsData = await getAllEvents({
        query: searchText,
        category,
        limit: 6,
        page,
      });
      console.log(eventsData, "eventsData")

  return (
    <>
     <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
          <h3 className="wrapper h3-bold text-center sm:text-left">Scan For The Events</h3>
        </section>

        <section
        id="events"
        className="wrapper my-8 flex flex-col gap-8 md:gap-12"
      >
        <form action="/" method="GET" className="flex w-full flex-col gap-5 md:flex-row items-center">
          <Search />
          <CategoryFilter />
          <ClearFiltersButton />
        </form>

        <Collection
          data={eventsData.data}
          emptyTitle="No Events Found"
          emptyStateSubtext="Come back later"
          collectionType="All_Events"
          limit={6}
          page={page}
          totalPages={eventsData?.totalPages}
          linkPrefix="/employer/events"
          />
      </section>
    </>
  )
}