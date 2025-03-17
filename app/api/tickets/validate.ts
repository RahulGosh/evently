// /pages/api/tickets/validate.ts

import { db } from '@/lib/db';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { ticketId, eventId, employerId } = req.body;

  const employer = await db.user.findUnique({
    where: { id: employerId, role: "EMPLOYER" },
  });

  if (!employer) {
    throw new Error('Unauthorized: Employer not found.');
  }
  console.log(employer, "action employer")

  // Find the ticket
  const ticket = await db.order.findUnique({
    where: { id: ticketId },
    include: { event: true },
  });
  console.log(ticket, "action ticket")
  if (!ticket) {
    throw new Error('Ticket not found.');
  }

  // Check if ticket belongs to the event
  if (ticket.eventId !== eventId) {
    throw new Error('Ticket does not belong to this event.');
  }

  // Check if ticket has been scanned before
  const existingScan = await db.ticketScan.findFirst({
    where: { orderId: ticketId, eventId },
  });

  if (existingScan) {
    throw new Error('Ticket already scanned.');
  }

  // Record the scan
  await db.ticketScan.create({
    data: {
      orderId: ticketId,
      eventId,
      scannerId: employerId,
      isValid: true,
      scanResult: 'VALID',
    },
  });

  return { message: 'Ticket scanned successfully' };
};

// Function to get all scanned tickets for a specific event
export const getScannedTickets = async (eventId: string) => {
    if (!eventId) {
      throw new Error('Invalid request: Missing event ID.');
    }
  
    const scannedTickets = await db.ticketScan.findMany({
      where: { eventId },
      include: {
        order: {
          include: {
            buyer: true, // Fetching buyer details (since 'user' does not exist)
          },
        },
        scanner: true, // Fetching employer details who scanned the ticket
      },
      orderBy: {
        scannedAt: 'desc', // Using the correct field instead of 'createdAt'
      },
    });
  
    return scannedTickets;
}
