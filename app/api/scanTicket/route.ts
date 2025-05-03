import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Adjust the import based on your db setup
import { revalidatePath } from "next/cache"; // For revalidating paths

export async function POST(request: Request) {
  try {
    const { ticketId, scannerId, eventId } = await request.json();

    // Validate required fields
    if (!ticketId || !scannerId || !eventId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const scanner = await db.user.findUnique({
      where: { id: scannerId }
    });
    
    if (!scanner) {
      return NextResponse.json(
        { success: false, message: "Invalid scanner ID" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
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

      return NextResponse.json(
        { success: false, message: "Invalid ticket: This ticket is for a different event" },
        { status: 400 }
      );
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

      return NextResponse.json(
        { success: false, message: `Ticket already scanned at ${existingValidScan.scannedAt.toLocaleString()}` },
        { status: 400 }
      );
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

      return NextResponse.json(
        { success: false, message: `Event already ended at ${ticket.event.endDateTime.toLocaleString()}` },
        { status: 400 }
      );
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

    return NextResponse.json(
      { success: true, message: "Ticket validated successfully!", data: scanRecord },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error scanning ticket:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}