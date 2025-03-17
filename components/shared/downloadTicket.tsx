import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import TicketPDF from "./ticketPdf";

interface DownloadTicketProps {
  event: any;
  order: any;
}

const DownloadTicket = ({ event, order }: DownloadTicketProps) => {
  if (!event || !order) return null;

  return (
    <PDFDownloadLink
      document={<TicketPDF event={event} order={order} />}
      fileName={`${event.title.replace(/\s+/g, "_")}_ticket.pdf`} // Using event title as the filename
      className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary-500 px-4 py-2.5 text-white transition-all hover:bg-primary-600"
    >
      {({ loading }) => (
        <>
          <Download className="h-5 w-5" />
          <span className="font-medium">
            {loading ? "Preparing Download..." : "Download Ticket"}
          </span>
        </>
      )}
    </PDFDownloadLink>
  );
};

export default DownloadTicket;
