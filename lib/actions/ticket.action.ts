"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import sendEmail from "../mail";
import { generateTicketPdfBuffer } from "@/components/shared/tickerPdf"; // ensure path/file name is correct
import { ScanResult } from "@prisma/client";
import { syncUser } from "./user.action";

/**
 * Get a single ticket (order) by its ID
 */
export async function getSingleTicket(ticketId: string) {
  try {
    const ticket = await db.order.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            image: true,
          },
        },
        ticketScans: {
          include: {
            scanner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
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
    const ticket = await db.order.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        ticketScans: true,
      },
    });

    if (!ticket) throw new Error("Ticket not found");

    // Wrong event?
    if (ticket.eventId !== eventId) {
      await db.ticketScan.create({
        data: {
          orderId: ticket.id,
          eventId,
          scannerId,
          isValid: false,
          scanResult: ScanResult.WRONG_EVENT,
          notes: `Ticket is for event ${ticket.eventId}, but scanned at event ${eventId}`,
        },
      });
      throw new Error("Invalid ticket: This ticket is for a different event");
    }

    // Already scanned for this event?
    const existingValidScan = ticket.ticketScans.find(
      (scan) => scan.isValid && scan.eventId === eventId
    );

    if (existingValidScan) {
      await db.ticketScan.create({
        data: {
          orderId: ticket.id,
          eventId,
          scannerId,
          isValid: false,
          scanResult: ScanResult.ALREADY_SCANNED,
          notes: `Ticket already scanned at ${existingValidScan.scannedAt}`,
        },
      });

      throw new Error(
        `Ticket already scanned at ${existingValidScan.scannedAt.toLocaleString()}`
      );
    }

    // Event expired?
    const now = new Date();
    if (now > ticket.event.endDateTime) {
      await db.ticketScan.create({
        data: {
          orderId: ticket.id,
          eventId,
          scannerId,
          isValid: false,
          scanResult: ScanResult.EXPIRED,
          notes: `Event ended at ${ticket.event.endDateTime}`,
        },
      });

      throw new Error(
        `Event already ended at ${ticket.event.endDateTime.toLocaleString()}`
      );
    }

    // Valid scan
    const scanRecord = await db.ticketScan.create({
      data: {
        orderId: ticket.id,
        eventId,
        scannerId,
        isValid: true,
        scanResult: ScanResult.VALID,
        notes: "Valid ticket entry",
      },
    });

    revalidatePath(`/events/${eventId}`);
    return scanRecord;
  } catch (error) {
    console.error("Error scanning ticket:", error);
    throw error;
  }
}

/**
 * Get all scanned tickets for an event (paginated)
 */
export async function getScannedTickets(
  eventId: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const skip = (page - 1) * limit;

    const scannedTickets = await db.ticketScan.findMany({
      where: { eventId },
      include: {
        scanner: {
          select: {
            id: true,
            fullName: true,
          },
        },
        order: {
          include: {
            buyer: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { scannedAt: "desc" },
      skip,
      take: limit,
    });

    const totalCount = await db.ticketScan.count({ where: { eventId } });

    return {
      scannedTickets,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error fetching scanned tickets:", error);
    throw error;
  }
}

/**
 * Email a PDF ticket to the buyer
 */
/**
 * Email a PDF ticket to the buyer
 */
/**
 * Email a PDF ticket to the buyer
 */
export const sendTicketEmail = async (
  formData: FormData | { eventId: string; orderId: string; userId?: string }
) => {
  try {
    const eventId =
      formData instanceof FormData
        ? formData.get("eventId")?.toString()
        : formData.eventId;

    const orderId =
      formData instanceof FormData
        ? formData.get("orderId")?.toString()
        : formData.orderId;

    const clerkUserId =
      formData instanceof FormData
        ? formData.get("userId")?.toString()
        : (formData as any).userId;

    if (!eventId || !orderId) {
      throw new Error("Missing event or order ID");
    }
    if (!clerkUserId) {
      throw new Error("User ID is required to send ticket email");
    }

    // First, try to get the database user from the Clerk user ID
    let databaseUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true, role: true, clerkId: true },
    });
    
    // If user doesn't exist in database, sync them first
    if (!databaseUser) {
      const syncedUser = await syncUser(clerkUserId);
      if (!syncedUser) throw new Error("Failed to sync user");
      
      databaseUser = {
        id: syncedUser.id,
        role: syncedUser.role,
        clerkId: syncedUser.clerkId
      };
    }

    // Event
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        category: true,
        organizer: true,
      },
    });
    if (!event) throw new Error("Event not found");

    // Order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { 
        buyer: true,
        event: true,
      },
    });
    if (!order) throw new Error("Order not found");

    // Security: owner or admin
    // Check if the current user is the buyer OR an admin
    const isBuyer = order.buyer?.clerkId === clerkUserId;
    const isAdmin = databaseUser.role === "ADMIN";
    
    if (!isBuyer && !isAdmin) {
      throw new Error("Unauthorized access to this ticket");
    }

    const buyerEmail = order.buyer?.email;
    if (!buyerEmail) throw new Error("Buyer email not found");

    // Data for PDF
    const pdfData = {
      event: {
        title: event.title,
        description: event.description || "",
        location: event.location || "",
        imageUrl: event.imageUrl || "",
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        price: event.price || "0",
        category: event.category ? { name: event.category.name } : undefined,
        organizer: event.organizer
          ? { name: event.organizer.fullName || "" }
          : undefined,
      },
      order: {
        id: order.id,
        createdAt: order.createdAt,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        buyer: order.buyer
          ? {
              name: order.buyer.fullName || "",
              email: order.buyer.email || "",
            }
          : undefined,
      },
    };

    // Generate PDF
    const pdfBuffer = await generateTicketPdfBuffer(pdfData);

    const eventDate = new Date(event.startDateTime).toLocaleString();

    const emailMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4f46e5;">Your Ticket is Ready!</h1>
        </div>

        <div style="margin-bottom: 20px; text-align: center;">
          <img 
            src="${event.imageUrl || "/default-event-image.jpg"}" 
            alt="${event.title}" 
            style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
          />
        </div>

        <div style="margin-bottom: 20px;">
          <p>Dear ${order.buyer?.fullName || "Attendee"},</p>
          <p>Thank you for purchasing a ticket to <strong>${event.title}</strong>. We're excited to have you join us!</p>
          <p>Your ticket is attached to this email as a PDF file.</p>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #111827; font-size: 18px;">Event Details</h2>
          <p><strong>Date & Time:</strong> ${eventDate}</p>
          <p><strong>Location:</strong> ${event.location || "Not specified"}</p>
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

    await sendEmail({
      email: buyerEmail,
      subject: `Your Ticket for ${event.title}`,
      message: emailMessage,
      attachments: [
        {
          filename: `${event.title.replace(/\s+/g, "_")}_ticket.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    revalidatePath("/dashboard/tickets");
    return { success: true, message: "Ticket sent to your email" };
  } catch (error: any) {
    console.error("Error sending ticket email:", error);
    return {
      success: false,
      message: error?.message || "Failed to send ticket email",
    };
  }
};