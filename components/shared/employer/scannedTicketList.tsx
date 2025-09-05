import { TicketScan, ScanResult } from "@prisma/client";
import Pagination from "../pagination";

// Extended TicketScan type to include relational data
export interface ExtendedTicketScan extends TicketScan {
  order: {
    id: string;
    quantity: number;
    buyer: {
      name?: string | null;
      email?: string | null;
    };
  };
  event: {
    title: string;
  };
  scanner: {
    name?: string | null;
  };
}

interface ScannedTicketsListProps {
  scannedTickets: ExtendedTicketScan[];
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
  // Helper function to get appropriate status badge styling
  const getScanResultBadge = (result: ScanResult) => {
    switch (result) {
      case "VALID":
        return "bg-green-100 text-green-700";
      case "INVALID":
        return "bg-red-100 text-red-700";
      case "ALREADY_SCANNED":
        return "bg-amber-100 text-amber-700";
      case "WRONG_EVENT":
        return "bg-purple-100 text-purple-700";
      case "EXPIRED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gray-50 p-4 border-b">
        <h2 className="text-lg font-medium">{h2ScannedText}</h2>
        <p className="text-sm text-gray-500">Showing {scannedTickets.length} of {length} tickets</p>
      </div>
      
      <div className="divide-y">
        {scannedTickets.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No scanned tickets yet</p>
          </div>
        ) : (
          <>
            {scannedTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    ticket.isValid 
                      ? "bg-green-100 text-green-600" 
                      : "bg-red-100 text-red-600"
                  }`}>
                    {ticket.isValid ? "✓" : "✗"}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Ticket #{ticket.orderId}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getScanResultBadge(ticket.scanResult)}`}>
                        {ticket.scanResult.replace("_", " ")}
                      </span>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Scanned:</span> {new Date(ticket.scannedAt).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Scanner:</span> {ticket.scanner?.name || "Unknown"}
                      </div>

                      {ticket.order?.buyer?.name && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Attendee:</span> {ticket.order.buyer.name}
                        </div>
                      )}
                      
                      {ticket.order?.buyer?.email && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Email:</span> {ticket.order.buyer.email}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Event:</span> {ticket.event?.title || "Unknown Event"}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Quantity:</span> {ticket.order?.quantity || 1}
                      </div>
                      
                      {ticket.notes && (
                        <div className="col-span-2 text-xs text-gray-500">
                          <span className="font-medium">Notes:</span> {ticket.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="p-4 bg-gray-50 border-t">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ScannedTicketsList;