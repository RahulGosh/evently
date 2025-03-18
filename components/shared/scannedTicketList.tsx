import { TicketScan } from "@prisma/client";
import Pagination from "./pagination";

interface ScannedTicketsListProps {
  scannedTickets: TicketScan[];
  h2ScannedText: string;
  length: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ScannedTicketsList = ({
  scannedTickets,
  h2ScannedText,
  length,
  page,
  totalPages,
  onPageChange,
}: ScannedTicketsListProps) => {
  return (
    <div className="divide-y">
      {scannedTickets.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p>No scans yet</p>
        </div>
      ) : (
        <>
          {scannedTickets.map((ticket) => (
            <div key={ticket.id} className="p-4 flex items-start gap-3">
              <span className={`mt-1 ${ticket.isValid ? "text-green-600" : "text-red-600"}`}>
                {ticket.isValid ? "✔️" : "❌"}
              </span>
              <div>
                <p className="text-sm font-medium">Ticket ID: {ticket.orderId}</p>
                <p className="text-xs text-gray-500">
                  {new Date(ticket.scannedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {/* ✅ Add Pagination */}
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ScannedTicketsList;
