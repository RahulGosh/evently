import React from 'react';
import { format } from 'date-fns';
import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'column',
    width: '70%',
  },
  headerRight: {
    width: '30%',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111827',
  },
  ticketNumber: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
  },
  contentContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoColumn: {
    flex: 1,
    marginRight: 15,
  },
  detailsColumn: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    borderLeft: 3,
    borderLeftColor: '#4F46E5',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  text: {
    fontSize: 12,
    marginBottom: 6,
    color: '#4B5563',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#111827',
  },
  divider: {
    borderBottom: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 15,
  },
  barcodeContainer: {
    alignItems: 'center',
    marginVertical: 20,
    borderTop: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 15,
  },
  qrCode: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  barcodeText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 5,
  },
  scanInstructions: {
    fontSize: 10,
    textAlign: 'center',
    color: '#6B7280',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  locationText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#6B7280',
  },
  footer: {
    marginTop: 'auto',
    borderTop: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});

interface TicketPDFProps {
  event: {
    title: string;
    description?: string | null;
    location?: string | null;
    imageUrl?: string | null;
    startDateTime: string | Date;
    endDateTime: string | Date;
    price?: string | number | null;
    category?: { name: string } | null;
    organizer?: { name?: string | null } | null;
  };
  order: {
    id: string;
    createdAt: string | Date;
    quantity: number;
    totalAmount: string | number;
    barcodeId?: string | null;
    buyer?: {
      name?: string | null;
      email?: string | null;
    } | null;
  };
}

const TicketPDF: React.FC<TicketPDFProps> = ({ event, order }) => {
  // Safely handle all possible null/undefined values
  const safeEvent = {
    title: event.title || 'Untitled Event',
    description: event.description || 'No description provided',
    location: event.location || 'Location not specified',
    imageUrl: event.imageUrl || '/default-event-image.jpg',
    startDateTime: event.startDateTime,
    endDateTime: event.endDateTime,
    price: event.price 
      ? typeof event.price === 'number' 
        ? `$${event.price.toFixed(2)}` 
        : event.price 
      : 'Free',
    category: event.category || undefined,
    organizer: event.organizer || undefined,
  };

  const safeOrder = {
    id: order.id,
    createdAt: order.createdAt,
    quantity: order.quantity,
    totalAmount: typeof order.totalAmount === 'number' 
      ? `$${order.totalAmount.toFixed(2)}` 
      : order.totalAmount,
    barcodeId: order.barcodeId || undefined,
    buyer: order.buyer || undefined,
  };

  const location = safeEvent.location.trim();
  
  // Generate Google Maps URL
  const mapsUrl = location 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    : '';
  
  // Generate QR code for location
  const qrCodeUrl = mapsUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mapsUrl)}&margin=10&color=4F46E5`
    : '';

  // Generate QR code for ticket ID
  const ticketQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${safeOrder.id}&margin=10&color=000000`;

  // Calculate duration
  const startDate = new Date(safeEvent.startDateTime);
  const endDate = new Date(safeEvent.endDateTime);
  const durationHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));

  // Format dates
  const formatEventDate = (date: Date) => ({
    day: format(date, 'EEE, MMM d, yyyy'),
    time: format(date, 'h:mm a')
  });

  const startDateFormatted = formatEventDate(startDate);
  const endDateFormatted = formatEventDate(endDate);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{safeEvent.title}</Text>
            <Text style={styles.ticketNumber}>Ticket #{safeOrder.id}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.badge}>CONFIRMED</Text>
          </View>
        </View>

        {/* Event Image */}
        <View style={styles.imageContainer}>
          <Image src={safeEvent.imageUrl} style={styles.eventImage} />
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Left Column */}
          <View style={styles.infoColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date & Time</Text>
              <Text style={styles.text}>
                <Text style={styles.highlight}>Start: </Text>{startDateFormatted.day}
              </Text>
              <Text style={styles.text}>{startDateFormatted.time}</Text>
              <View style={styles.divider} />
              <Text style={styles.text}>
                <Text style={styles.highlight}>End: </Text>{endDateFormatted.day}
              </Text>
              <Text style={styles.text}>{endDateFormatted.time}</Text>
              <View style={styles.divider} />
              <Text style={styles.text}>
                <Text style={styles.highlight}>Duration: </Text>{durationHours} hour{durationHours !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.detailsColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.text}>{location || 'N/A'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Details</Text>
              <Text style={styles.text}>
                <Text style={styles.highlight}>Order Date: </Text>
                {format(new Date(safeOrder.createdAt), 'MMM d, yyyy')}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.highlight}>Ticket Price: </Text>{safeEvent.price}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.highlight}>Quantity: </Text>{safeOrder.quantity}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.highlight}>Total: </Text>{safeOrder.totalAmount}
              </Text>
            </View>
          </View>
        </View>

        {/* Event Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Description</Text>
          <Text style={styles.text}>{safeEvent.description}</Text>
        </View>

        {/* Ticket QR Code */}
        <View style={styles.barcodeContainer}>
          <Text style={styles.barcodeText}>TICKET ID: {safeOrder.id}</Text>
          <Image src={ticketQrUrl} style={styles.qrCode} />
          <Text style={styles.scanInstructions}>Scan this QR code at the event for entry</Text>
        </View>

        {/* Location QR Code */}
        {location && (
          <View style={styles.qrCodeContainer}>
            <Image src={qrCodeUrl} style={styles.qrCode} />
            <Text style={styles.locationText}>Scan to view location on Google Maps</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated: {format(new Date(), 'PPP p')}</Text>
          <Text style={styles.footerText}>Please present this ticket at the event entrance</Text>
        </View>
      </Page>
    </Document>
  );
};

// Helper function to generate PDF buffer
export const generateTicketPdfBuffer = async (props: TicketPDFProps): Promise<Buffer> => {
  const pdfDoc = <TicketPDF {...props} />;
  const blob = await pdf(pdfDoc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const createTicketPDF = (props: TicketPDFProps) => {
  return <TicketPDF {...props} />;
};

export default TicketPDF;