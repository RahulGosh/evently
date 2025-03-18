"use server"

// /lib/actions/ticket.action.ts

import { revalidatePath } from "next/cache";
import { db } from "../db";

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
