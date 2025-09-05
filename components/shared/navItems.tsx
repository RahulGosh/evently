"use client";

import { headerLinks } from "@/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavItemsProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmployer: boolean;
}

const NavItems = ({ isAuthenticated, isAdmin, isEmployer }: NavItemsProps) => {
  const pathname = usePathname();
  
  // Filter links based on authentication and admin status
  const filteredLinks = headerLinks.filter((link) => {
    // Home is always visible to everyone
    if (link.route === "/") {
      return true;
    }
    
    // Profile is only visible to logged-in users (both regular and admin)
    if (link.route === "/profile") {
      return isAuthenticated;
    }
    
    // Create Event is only visible to admins
    if (link.route === "/admin/events/create") {
      return isAuthenticated && isAdmin;
    }

    if(link.route === "/employer/events") {
      return isAuthenticated && isEmployer;
    }
    
    return false;
  });
  
  console.log("Auth Status:", { isAuthenticated, isAdmin });
  console.log("Filtered Links:", filteredLinks);

  return (
    <ul className="flex w-full flex-col items-center justify-center gap-8 md:flex-row md:justify-center md:gap-8">
      {filteredLinks.map((link) => {
        const isActive = pathname === link.route;

        return (
          <li
            key={link.route}
            className={`${
              isActive ? "text-primary-500" : ""
            } flex-center p-medium-16 whitespace-nowrap px-4`}
          >
            <Link href={link.route}>{link.label}</Link>
          </li>
        );
      })}
    </ul>
  );
};

export default NavItems;




// import { format } from 'date-fns';
// import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
// import bwipjs from 'bwip-js';
// import React from 'react';

// const styles = StyleSheet.create({
//   page: {
//     flexDirection: 'column',
//     backgroundColor: '#ffffff',
//     padding: 30,
//   },
//   header: {
//     marginBottom: 20,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   headerLeft: {
//     flexDirection: 'column',
//     width: '70%',
//   },
//   headerRight: {
//     width: '30%',
//     alignItems: 'flex-end',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 5,
//     color: '#111827',
//   },
//   ticketNumber: {
//     fontSize: 12,
//     color: '#6B7280',
//     fontStyle: 'italic',
//   },
//   badge: {
//     backgroundColor: '#EEF2FF',
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 4,
//     color: '#4F46E5',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   imageContainer: {
//     marginBottom: 20,
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   eventImage: {
//     width: '100%',
//     height: 200,
//     objectFit: 'cover',
//   },
//   contentContainer: {
//     flexDirection: 'row',
//     marginBottom: 20,
//   },
//   infoColumn: {
//     flex: 1,
//     marginRight: 15,
//   },
//   detailsColumn: {
//     flex: 1,
//   },
//   section: {
//     marginBottom: 20,
//     backgroundColor: '#F9FAFB',
//     padding: 15,
//     borderRadius: 8,
//     borderLeft: 3,
//     borderLeftColor: '#4F46E5',
//   },
//   sectionTitle: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginBottom: 8,
//     color: '#111827',
//   },
//   text: {
//     fontSize: 12,
//     marginBottom: 6,
//     color: '#4B5563',
//   },
//   highlight: {
//     fontWeight: 'bold',
//     color: '#111827',
//   },
//   divider: {
//     borderBottom: 1,
//     borderBottomColor: '#E5E7EB',
//     marginVertical: 15,
//   },
//   qrCodeContainer: {
//     alignItems: 'center',
//     marginVertical: 20,
//   },
//   qrCode: {
//     width: 120,
//     height: 120,
//     marginBottom: 8,
//   },
//   locationText: {
//     fontSize: 10,
//     textAlign: 'center',
//     color: '#6B7280',
//   },
//   footer: {
//     marginTop: 'auto',
//     borderTop: 1,
//     borderTopColor: '#E5E7EB',
//     paddingTop: 15,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   footerText: {
//     fontSize: 10,
//     color: '#9CA3AF',
//   },
//   barcodeContainer: {
//     alignItems: 'center',
//     marginBottom: 20,
//     padding: 15,
//     backgroundColor: '#F3F4F6',
//     borderRadius: 8,
//   },
//   barcode: {
//     width: 250,
//     height: 80,
//     marginBottom: 8,
//   },
//   barcodeText: {
//     fontSize: 10,
//     color: '#4B5563',
//     textAlign: 'center',
//   },
// });

// interface TicketPDFProps {
//   event: {
//     title: string;
//     description: string;
//     location: string;
//     imageUrl: string;
//     startDateTime: string;
//     endDateTime: string;
//     price: string;
//     id: string;
//   };
//   order: {
//     id: string;
//     createdAt: string;
//     quantity: number;
//     totalAmount: string;
//     buyerId?: string;
//   };
//   barcodeDataUrl?: string; // Pre-generated barcode URL
// }

// // Function to generate secure barcode data
// const generateSecureBarcodeData = (orderId: string, eventId: string, buyerId?: string) => {
//   const payload = {
//     t: orderId,
//     e: eventId,
//     b: buyerId || 'unknown',
//     c: Date.now(),
//   };
  
//   const secureData = Buffer.from(JSON.stringify(payload)).toString('base64');
//   return `EVNT-${secureData}`;
// };

// // This function should be called BEFORE rendering the PDF component
// export const generateBarcodeDataUrl = async (orderId: string): Promise<string> => {
//   try {
//     const png = await bwipjs.toBuffer({
//       bcid: 'code128',
//       text: orderId,
//       scale: 3,
//       height: 10,
//       includetext: true,
//       textxalign: 'center',
//       textsize: 8,
//     });

//     return `data:image/png;base64,${png.toString('base64')}`;
//   } catch (error) {
//     console.error('Error generating barcode:', error);
//     return '';
//   }
// };

// const TicketPDF = ({ event, order, barcodeDataUrl }: TicketPDFProps) => {
//   // Only generate maps URL if location exists and is not empty
//   const location = event.location && event.location.trim();
  
//   // Generate a Google Maps URL for the event location
//   const mapsUrl = location 
//     ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
//     : '';
  
//   // Only generate QR code if we have a valid maps URL
//   const qrCodeUrl = mapsUrl
//     ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mapsUrl)}&margin=10&color=4F46E5`
//     : '';

//   // Calculate duration in hours
//   const startDate = new Date(event.startDateTime);
//   const endDate = new Date(event.endDateTime);
//   const durationHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));

//   // Format date for display
//   const formatEventDate = (date: Date) => {
//     const day = format(date, 'EEE, MMM d, yyyy');
//     const time = format(date, 'h:mm a');
//     return { day, time };
//   };

//   const startDateFormatted = formatEventDate(startDate);
//   const endDateFormatted = formatEventDate(endDate);

//   // Create a fallback barcode URL if not provided
//   const fallbackBarcodeUrl = 'https://bwipjs-api.metafloor.com/?bcid=code128&text=' + 
//                             encodeURIComponent(order.id) + 
//                             '&scale=3&includetext&textxalign=center';

//   return (
//     <Document>
//     <Page size="A4" style={styles.page}>
//       {/* Header Section */}
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <Text style={styles.title}>{event.title}</Text>
//           <Text style={styles.ticketNumber}>Ticket #{order.id}</Text>
//         </View>
//         <View style={styles.headerRight}>
//           <Text style={styles.badge}>CONFIRMED</Text>
//         </View>
//       </View>

//       {/* Event Image */}
//       <View style={styles.imageContainer}>
//         <Image src={event.imageUrl} style={styles.eventImage} />
//       </View>

//       {/* Secure Barcode Section */}
//       <View style={styles.barcodeContainer}>
//         <Image 
//           src={barcodeDataUrl || fallbackBarcodeUrl} 
//           style={styles.barcode} 
//         />
//         <Text style={styles.barcodeText}>Entry Ticket - For Official Scanner Use Only</Text>
//       </View>

//       {/* Main Content */}
//       <View style={styles.contentContainer}>
//         {/* Left Column */}
//         <View style={styles.infoColumn}>
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Date & Time</Text>
//             <Text style={styles.text}>
//               <Text style={styles.highlight}>Start: </Text>{startDateFormatted.day}
//             </Text>
//             <Text style={styles.text}>{startDateFormatted.time}</Text>
//             <View style={styles.divider} />
//             <Text style={styles.text}>
//               <Text style={styles.highlight}>End: </Text>{endDateFormatted.day}
//             </Text>
//             <Text style={styles.text}>{endDateFormatted.time}</Text>
//             <View style={styles.divider} />
//             <Text style={styles.text}>
//               <Text style={styles.highlight}>Duration: </Text>{durationHours} hour{durationHours !== 1 ? 's' : ''}
//             </Text>
//           </View>
//         </View>

//         {/* Right Column */}
//         <View style={styles.detailsColumn}>
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Location</Text>
//             <Text style={styles.text}>{location || 'N/A'}</Text>
//           </View>

//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Order Details</Text>
//             <Text style={styles.text}>
//               <Text style={styles.highlight}>Order Date: </Text>
//               {format(new Date(order.createdAt), 'MMM d, yyyy')}
//             </Text>
//             <Text style={styles.text}>
//               <Text style={styles.highlight}>Ticket Price: </Text>{event.price}
//             </Text>
//             <Text style={styles.text}>
//               <Text style={styles.highlight}>Quantity: </Text>{order.quantity}
//             </Text>
//             <Text style={styles.text}>
//               <Text style={styles.highlight}>Total: </Text>{order.totalAmount}
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* Event Description */}
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Event Description</Text>
//         <Text style={styles.text}>{event.description}</Text>
//       </View>

//       {/* QR Code for Location */}
//       <View style={styles.qrCodeContainer}>
//         {location ? (
//           <>
//             <Image src={qrCodeUrl} style={styles.qrCode} />
//             <Text style={styles.locationText}>Scan to view location on Google Maps</Text>
//           </>
//         ) : (
//           <Text style={styles.locationText}>No location information available</Text>
//         )}
//       </View>

//       {/* Footer */}
//       <View style={styles.footer}>
//         <Text style={styles.footerText}>Generated: {format(new Date(), 'PPP p')}</Text>
//         <Text style={styles.footerText}>Please present this ticket at the event entrance</Text>
//       </View>
//     </Page>
//   </Document>
//   );
// };

// export default TicketPDF;