"use server"

// /lib/actions/ticket.action.ts

import { revalidatePath } from "next/cache";
import { db } from "../db";
import { renderToBuffer } from "@react-pdf/renderer";
import sendEmail from "../mail";
import TicketPDF, { createTicketPDF, generateTicketPdfBuffer } from './../../components/shared/ticketPdf';
import { auth } from "@/auth";

/**
 * Get a single ticket by its ID
 */
export async function getSingleTicket(ticketId: string) {
  try {
    // Assuming ticketId is the orderId in this case
    const ticket = await db.order.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        ticketScans: {
          include: {
            scanner: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    return ticket;
  } catch (error) {
    console.error("Error getting ticket:", error);
    throw error;
  }
}

/**
 * Scan a ticket for event entry
 */
export async function scanTicket(
  ticketId: string,
  scannerId: string,
  eventId: string
) {
  try {
    // First find the ticket (order)
    const ticket = await db.order.findUnique({
      where: { 
        id: ticketId 
      },
      include: {
        event: true,
        ticketScans: true
      }
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Check if the ticket is for the correct event
    if (ticket.eventId !== eventId) {
      // Create scan record with wrong event status
      await db.ticketScan.create({
        data: {
          orderId: ticket.id,
          eventId: eventId,
          scannerId: scannerId,
          isValid: false,
          scanResult: "WRONG_EVENT",
          notes: `Ticket is for event ${ticket.eventId}, but scanned at event ${eventId}`
        }
      });

      throw new Error(`Invalid ticket: This ticket is for a different event`);
    }

    // Check if the ticket has already been scanned
    const existingValidScan = ticket.ticketScans.find(scan => 
      scan.isValid && scan.eventId === eventId
    );

    if (existingValidScan) {
      // Create scan record with already scanned status
      await db.ticketScan.create({
        data: {
          orderId: ticket.id,
          eventId: eventId,
          scannerId: scannerId,
          isValid: false,
          scanResult: "ALREADY_SCANNED",
          notes: `Ticket already scanned at ${existingValidScan.scannedAt}`
        }
      });

      throw new Error(`Ticket already scanned at ${existingValidScan.scannedAt.toLocaleString()}`);
    }

    // Check if the event has already ended
    const now = new Date();
    if (now > ticket.event.endDateTime) {
      // Create scan record with expired status
      await db.ticketScan.create({
        data: {
          orderId: ticket.id,
          eventId: eventId,
          scannerId: scannerId,
          isValid: false,
          scanResult: "EXPIRED",
          notes: `Event ended at ${ticket.event.endDateTime}`
        }
      });

      throw new Error(`Event already ended at ${ticket.event.endDateTime.toLocaleString()}`);
    }

    // If all checks pass, create a valid scan record
    const scanRecord = await db.ticketScan.create({
      data: {
        orderId: ticket.id,
        eventId: eventId,
        scannerId: scannerId,
        isValid: true,
        scanResult: "VALID",
        notes: "Valid ticket entry"
      }
    });

    // Revalidate the path to update UI
    revalidatePath(`/events/${eventId}`);

    return scanRecord;
  } catch (error) {
    console.error("Error scanning ticket:", error);
    throw error;
  }
}

/**
 * Get all scanned tickets for an event
 */
export async function getScannedTickets(eventId: string, page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit;

    const scannedTickets = await db.ticketScan.findMany({
      where: {
        eventId: eventId,
      },
      include: {
        scanner: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        scannedAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await db.ticketScan.count({
      where: { eventId: eventId },
    });

    return {
      scannedTickets,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error fetching scanned tickets:", error);
    throw error;
  }
}

export const sendTicketEmail = async (formData: FormData | { eventId: string; orderId: string; userId?: string }) => {
  try {
    // Get data either from FormData or direct object
    const eventId = formData instanceof FormData 
      ? formData.get('eventId')?.toString() 
      : formData.eventId;
    
    const orderId = formData instanceof FormData 
      ? formData.get('orderId')?.toString() 
      : formData.orderId;

    const userId = formData instanceof FormData
      ? formData.get('userId')?.toString()
      : (formData as any).userId;

    if (!eventId || !orderId) {
      throw new Error("Missing event or order ID");
    }

    // Fetch user data if userId provided
    let userRole;
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      if (!user) {
        throw new Error("User not found");
      }
      
      userRole = user.role;
    } else {
      // If no userId provided, we can't continue - require direct userId passing
      throw new Error("User ID is required to send ticket email");
    }

    // Fetch event details
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        category: true,
        organizer: true,
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    // Fetch order details
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Security check - ensure user owns this ticket or is admin
    if (order.buyerId !== userId && userRole !== "ADMIN") {
      throw new Error("Unauthorized access to this ticket");
    }

    // Get buyer email
    const buyerEmail = order.buyer?.email || (order as any).buyerEmail;
    
    if (!buyerEmail) {
      throw new Error("Buyer email not found");
    }

    // Prepare data for PDF generation
    const pdfData = {
      event: {
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        imageUrl: event.imageUrl || '',
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        price: event.price?.toString() || '0',
        category: event.category ? { name: event.category.name } : undefined,
        organizer: event.organizer ? { name: event.organizer.name || '' } : undefined,
      },
      order: {
        id: order.id,
        createdAt: order.createdAt,
        quantity: order.quantity,
        totalAmount: order.totalAmount.toString(),
        buyer: order.buyer ? { 
          name: order.buyer.name || '', 
          email: order.buyer.email || '' 
        } : undefined,
      }
    };

    // Generate PDF ticket
    const pdfBuffer = await generateTicketPdfBuffer(pdfData);

    // Format date for email
    const eventDate = new Date(event.startDateTime).toLocaleString();

    // Create email template
    const emailMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4f46e5;">Your Ticket is Ready!</h1>
      </div>
      
      <!-- Event Image Poster -->
      <div style="margin-bottom: 20px; text-align: center;">
        <img 
          src="${event.imageUrl || '/default-event-image.jpg'}" 
          alt="${event.title}" 
          style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
        />
      </div>
      
      <div style="margin-bottom: 20px;">
        <p>Dear ${order.buyer?.name || 'Attendee'},</p>
        <p>Thank you for purchasing a ticket to <strong>${event.title}</strong>. We're excited to have you join us!</p>
        <p>Your ticket is attached to this email as a PDF file.</p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #111827; font-size: 18px;">Event Details</h2>
        <p><strong>Date & Time:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${event.location || 'Not specified'}</p>
        <p><strong>Ticket Quantity:</strong> ${order.quantity}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p>Please keep this ticket safe and present it at the event entrance.</p>
        <p>If you have any questions, please contact the event organizer.</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated email, please do not reply.</p>
      </div>
    </div>
  `;

    // Send email with PDF attachment
    await sendEmail({
      email: buyerEmail,
      subject: `Your Ticket for ${event.title}`,
      message: emailMessage,
      attachments: [
        {
          filename: `${event.title.replace(/\s+/g, "_")}_ticket.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }
      ]
    });

    // Revalidate the path to update UI
    revalidatePath('/dashboard/tickets');
    
    return { success: true, message: "Ticket sent to your email" };
  } catch (error: any) {
    console.error("Error sending ticket email:", error);
    return { 
      success: false, 
      message: error.message || "Failed to send ticket email" 
    };
  }
};