import { TicketScan, User } from "@prisma/client";

// Define the possible ticket type
type AcceptedTicketScan = TicketScan & { scanner?: User | null };

interface ScannedTicketsListProps {
  scannedTickets: AcceptedTicketScan[];
  h2ScannedText: string;
  length?: number;
}

// Type guard to check if scanner is an object
const hasExpandedScanner = (ticket: AcceptedTicketScan): boolean =>
  !!ticket.scanner;

export default function ScannedTicketsList({ 
  scannedTickets, 
  h2ScannedText 
}: ScannedTicketsListProps) {
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
              <span className={`mt-1 ${ticket.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {ticket.isValid ? '✔️' : '❌'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Ticket ID: {ticket.orderId}</p>
                  <span className="text-xs text-gray-500">
                    {new Date(ticket.scannedAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {hasExpandedScanner(ticket) 
                    ? `Scanned by: ${ticket.scanner?.name || 'Unknown'}` 
                    : `Scanner ID: ${ticket.scannerId}`
                  }
                </p>
                <p className="text-sm text-gray-600">
                  Status: {ticket.isValid ? "Valid" : "Invalid"}
                </p>
                <p className="text-sm text-gray-600">
                  Result: {ticket.scanResult}
                </p>
                {ticket.notes && (
                  <p className="text-sm text-gray-600">Notes: {ticket.notes}</p>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
