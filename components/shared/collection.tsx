import React from "react";
import { Event, Category, User } from "@prisma/client";
import Card from "./card";
import Pagination from "./pagination";
import DownloadTicket from "./downloadTicket";

type EventWithRelations = Event & {
  category: Category;
  organizer: User;
};

type CollectionProps = {
  data: EventWithRelations[];
  emptyTitle: string;
  emptyStateSubtext: string;
  collectionType?: "Events_Organized" | "My_Tickets" | "All_Events";
  limit: number;
  page: number | string;
  totalPages?: number;
  urlParamName?: string;
  linkPrefix?: string;
  onDeleteSuccess?: () => void; // ✅ Add type for onDeleteSuccess
};

const Collection = ({
  data,
  emptyTitle,
  emptyStateSubtext,
  page,
  totalPages = 0,
  collectionType,
  urlParamName,
  linkPrefix = "/events/",
  onDeleteSuccess, // ✅ Accept refetch function
}: CollectionProps) => {
  return (
    <>
      {data && data.length > 0 ? (
        <div className="flex flex-col items-center gap-10">
          <ul className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
            {data.map((event, index) => {
              const hasOrderLink = collectionType === "Events_Organized";
              const hidePrice = collectionType === "My_Tickets";

              return (
                <li
                  key={`${event.id}-${index}`}
                  className="flex flex-col gap-4"
                >
                  <Card
                    event={event}
                    hasOrderLink={hasOrderLink}
                    hidePrice={hidePrice}
                    collectionType={collectionType}
                    linkPrefix={linkPrefix} // Pass down the prop
                    onDeleteSuccess={onDeleteSuccess} // ✅ Pass down refetch function
                  />
                </li>
              );
            })}
          </ul>
          {totalPages > 1 && (
            <Pagination
              urlParamName={urlParamName}
              page={page}
              totalPages={totalPages}
            />
          )}
        </div>
      ) : (
        <div className="flex-center wrapper min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-grey-50 py-28 text-center">
          <h3 className="p-bold-20 md:h5-bold">{emptyTitle}</h3>
          <p className="p-regular-14">{emptyStateSubtext}</p>
        </div>
      )}
    </>
  );
};

export default Collection;