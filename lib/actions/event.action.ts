"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import cloudinary from "cloudinary";
import { CreateCouponParams, CreateEventParams, DeleteEventParams } from "@/types";
import { formatDateTime } from "../utils";

cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getCategoryByName = async (name: string) => {
  return await db.category.findFirst({
    where: {
      name: { contains: name, mode: "insensitive" }, // Case-insensitive search
    },
  });
};

export const createEvent = async (
  event: CreateEventParams,
  userId: string,
  imageUrl: string,
  coupons?: CreateCouponParams[],
) => {
  try {
    // Validate inputs
    if (!userId) throw new Error("User ID is required");
    if (!imageUrl) throw new Error("Image URL is required");
    if (Number(event?.event?.ticketsLeft) < 0) {
      throw new Error("Tickets left cannot be negative");
    }

    // Check if the user exists
    const organizer = await db.user.findUnique({ where: { id: userId } });
    if (!organizer) throw new Error("Organizer not found");

    // Check if the category exists
    const category = await db.category.findUnique({
      where: { id: event?.event?.categoryId },
    });
    if (!category) throw new Error("Category not found");

    // Create event transaction
    const result = await db.$transaction(async (prisma) => {
      // Base event data
      const eventData: any = {
        title: event?.event?.title,
        description: event?.event?.description,
        location: event?.event?.location || "",
        imageUrl,
        startDateTime: event?.event?.startDateTime,
        endDateTime: event?.event?.endDateTime,
        price: event?.event?.price,
        isFree: event?.event?.isFree,
        url: event?.event?.url || null,
        categoryId: event?.event?.categoryId,
        organizerId: userId,
        ticketsLeft: event?.event?.ticketsLeft,
      };

      const newEvent = await prisma.event.create({
        data: eventData,
      });

      // Create coupons if provided
     if (coupons && coupons.length > 0) {
  await Promise.all(
    coupons.map((coupon) =>
      prisma.coupon.create({
        data: {
          code: coupon.code,
          discount: coupon.discount,
          isPercentage: coupon.isPercentage,
          maxUses: coupon.maxUses,
          startDate: coupon.startDate || new Date(),
          endDate: coupon.endDate,
          eventId: newEvent.id,
          isActive: true, // Make sure to set this
          currentUses: 0, // Make sure to set this
        },
      })
    )
  );
}

      return newEvent;
    });

    return result;
  } catch (error: any) {
    console.error("Error creating event:", error);
    throw new Error(error.message || "Failed to create event");
  }
};

// Create multiple coupons for an event
export const createEventCoupons = async (
  eventId: string,
  coupons: CreateCouponParams[]
) => {
  try {
    if (!eventId) throw new Error("Event ID is required");
    if (!coupons?.length) return [];

    // Verify event exists
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error("Event not found");

    // Check for duplicate codes in this batch
    const couponCodes = coupons.map((c) => c.code);
    if (new Set(couponCodes).size !== couponCodes.length) {
      throw new Error("Duplicate coupon codes in this request");
    }

    // Check for existing coupons with same codes
    const existingCoupons = await db.coupon.findMany({
      where: {
        eventId,
        code: { in: couponCodes },
      },
    });

    if (existingCoupons.length > 0) {
      throw new Error(
        `Some coupon codes already exist: ${existingCoupons
          .map((c) => c.code)
          .join(", ")}`
      );
    }

    // Create all coupons in a transaction
    const createdCoupons = await db.$transaction(
      coupons.map((coupon) =>
        db.coupon.create({
          data: {
            ...coupon,
            eventId,
            startDate: coupon.startDate || new Date(),
          },
        })
      )
    );

    return createdCoupons;
  } catch (error: any) {
    console.error("Error creating coupons:", error);
    throw new Error(error.message || "Failed to create coupons");
  }
};

export const getAllEvents = async ({
  query,
  page = 1,
  limit = 6,
  category,
}: {
  query?: string;
  page?: number;
  limit?: number;
  category?: string;
} = {}) => {
  try {
    const whereConditions: any = {};

    if (query) {
      whereConditions.title = { contains: query, mode: "insensitive" };
    }

    if (category) {
      const categoryData = await getCategoryByName(category);
      if (categoryData) {
        whereConditions.categoryId = categoryData.id;
      }
    }

    const skip = (page - 1) * limit; // Calculate offset for pagination

    const events = await db.event.findMany({
      where: whereConditions,
      include: {
        category: true,
        organizer: true,
      },
      orderBy: {
        startDateTime: "asc",
      },
      skip, // Offset for pagination
      take: limit, // Limit results
    });
    
    const totalCount = await db.event.count({ where: whereConditions });

    return {
      data: events,
      totalCount,
      totalPages: Math.ceil(totalCount / limit), // Calculate total pages
      currentPage: page,
    };
 } catch (error: any) {
    console.error("Error fetching events:", error);
    throw new Error("Failed to fetch events");
  }
};

export const getEventsByUser = async (
  userId: string,
  { page = 1, limit = 6 } = {}
) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const skip = (page - 1) * limit; // Calculate offset for pagination

    const events = await db.event.findMany({
      where: { organizerId: userId },
      include: {
        category: true,
      },
      orderBy: {
        startDateTime: "asc",
      },
      skip,
      take: limit,
    });

    const totalCount = await db.event.count({
      where: { organizerId: userId },
    });

    return {
      data: events,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error: any) {
    console.error("Error fetching events by user:", error.message || error);
    throw new Error(error.message || "Failed to fetch events by user");
  }
};

export const getEventById = async (eventId: string) => {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      category: true,
      organizer: true
    }
  });

  if (!event) throw new Error('Event not found');

  return {
    ...event,
  };
};

export const getRelatedEventsByCategory = async ({
  categoryId,
  eventId,
  limit = 3,
  page = 1,
}: {
  categoryId: string;
  eventId: string;
  limit?: number;
  page?: number;
}) => {
  try {
    if (!categoryId) {
      throw new Error("Category ID is required");
    }

    const skip = (page - 1) * limit; // Calculate offset for pagination

    const relatedEvents = await db.event.findMany({
      where: {
        categoryId,
        id: { not: eventId }, // Exclude the current event
      },
      include: {
        category: true, // Include category details
        organizer: true, // Include organizer details
      },
      orderBy: {
        startDateTime: "asc", // Order events by start time
      },
      skip,
      take: limit,
    });

    const totalCount = await db.event.count({
      where: {
        categoryId,
        id: { not: eventId },
      },
    });

    return {
      data: relatedEvents,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error: any) {
    console.error("Error fetching related events:", error.message || error);
    throw new Error(error.message || "Failed to fetch related events");
  }
};

const extractPublicIdFromUrl = (imageUrl: string): string | null => {
  const regex = /\/upload\/(?:v\d+\/)?([^/.]+)\./;
  const match = imageUrl.match(regex);
  return match ? match[1] : null;
};

export const deleteEvent = async ({
  eventId,
  path,
}: {
  eventId: string;
  path: string;
}) => {
  try {
    console.log("Deleting event with ID:", eventId);

    const deletedEvent = await db.$transaction(async (prisma) => {
      // ✅ Find the event to delete
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, startDateTime: true, imageUrl: true },
      });

      if (!event) {
        console.log("Event not found");
        throw new Error("Event not found");
      }

      const isExpired = new Date(event.startDateTime) < new Date();

      // ✅ If the event is expired, delete associated orders
      if (isExpired) {
        console.log("Event is expired, deleting related orders...");
        await prisma.order.deleteMany({
          where: { eventId },
        });
      }

      // ✅ Delete all related data
      await prisma.ticketScan.deleteMany({ where: { eventId } });
      await prisma.employerEvent.deleteMany({ where: { eventId } });
      
      // ✅ NEW: Delete all coupons associated with the event
      console.log("Deleting associated coupons...");
      await prisma.coupon.deleteMany({ 
        where: { eventId } 
      });

      // ✅ Delete Cloudinary image if it exists
      if (event.imageUrl) {
        const publicId = extractPublicIdFromUrl(event.imageUrl);
        if (publicId) {
          console.log("Deleting image from Cloudinary:", publicId);
          await cloudinary.v2.uploader.destroy(publicId);
        }
      }

      // ✅ Delete the event itself
      const deletedEvent = await prisma.event.delete({
        where: { id: eventId },
      });

      console.log("Event and all associated data deleted successfully");
      return deletedEvent;
    });

    // ✅ Revalidate the path on the server side
    revalidatePath(path);

    return { success: true, message: "Event and all associated coupons deleted successfully", path };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      message: "An error occurred while deleting the event",
    };
  }
};

export const deleteExpiredEvents = async () => {
  try {
    console.log("Running cleanup for expired events...");

    const tenHoursAgo = new Date();
    tenHoursAgo.setHours(tenHoursAgo.getHours() - 10);

    // Find expired events that ended at least 10 hours ago
    const expiredEvents = await db.event.findMany({
      where: {
        endDateTime: {
          lt: tenHoursAgo, // Find events where endDateTime is at least 10 hours in the past
        },
      },
    });

    console.log(
      `Found ${expiredEvents.length} events to delete (expired more than 10 hours ago)`
    );

    for (const event of expiredEvents) {
      // Delete related data
      await db.ticketScan.deleteMany({ where: { eventId: event.id } });
      await db.order.deleteMany({ where: { eventId: event.id } });
      await db.employerEvent.deleteMany({ where: { eventId: event.id } });

      // Delete image from Cloudinary if it exists
      if (event.imageUrl) {
        const publicId = extractPublicIdFromUrl(event.imageUrl);
        if (publicId) {
          console.log(`Deleting image from Cloudinary: ${publicId}`);
          await cloudinary.v2.uploader.destroy(publicId);
        }
      }

      // Delete event from database
      await db.event.delete({
        where: { id: event.id },
      });

      console.log(`Deleted expired event: ${event.id} (${event.title})`);
    }

    console.log("Expired events cleanup completed.");
    return { success: true, deletedCount: expiredEvents.length };
  } catch (error) {
    console.error("Error deleting expired events:", error);
    return { success: false, error };
  }
};

export const updateEvent = async (
  eventId: string,
  eventData: any,
  userId: string
) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!eventId) {
      throw new Error("Event ID is required");
    }

    console.log("Updating event:", eventId, "by user:", userId);

    // Check if the event exists
    const existingEvent = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new Error("Event not found");
    }

    let updatedImageUrl = existingEvent.imageUrl;

    // If the user provided a new image URL, delete the old one from Cloudinary first
    if (eventData.imageUrl && eventData.imageUrl !== existingEvent.imageUrl) {
      const publicId = extractPublicIdFromUrl(existingEvent.imageUrl);
      if (publicId) {
        console.log("Deleting old image from Cloudinary:", publicId);
        await cloudinary.v2.uploader.destroy(publicId);
      }
      updatedImageUrl = eventData.imageUrl; // Update with new image URL
    }

    // Update the event
    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location || "",
        imageUrl: updatedImageUrl,
        startDateTime: eventData.startDateTime,
        endDateTime: eventData.endDateTime,
        price: eventData.price,
        isFree: eventData.isFree ?? false,
        url: eventData.url || null,
        categoryId: eventData.categoryId,
      },
    });

    return updatedEvent;
  } catch (error: any) {
    console.error("Error updating event:", error.message || error);
    throw new Error(error.message || "Failed to update event");
  }
};

export const getEventCoupons = async (eventId: string) => {
  try {
    return await db.coupon.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw new Error('Failed to fetch coupons');
  }
};

// Validate coupon for checkout
export const validateEventCoupon = async (eventId: string, code: string) => {
  try {
    const coupon = await db.coupon.findFirst({
      where: {
        eventId,
        code,
        isActive: true,
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
    });

    if (!coupon) return { valid: false, message: 'Invalid coupon code' };
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return { valid: false, message: 'Coupon has reached its usage limit' };
    }

    return { valid: true, coupon };
  } catch (error) {
    console.error('Error validating coupon:', error);
    throw new Error('Failed to validate coupon');
  }
};

export const getNextUpcomingEvent = async () => {
  try {
    const now = new Date();
    
    const nextEvent = await db.event.findFirst({
      where: {
        startDateTime: {
          gt: now // Only future events
        }
      },
      orderBy: {
        startDateTime: 'asc' // Get the closest upcoming event
      },
      include: {
        category: true,
        organizer: true
      }
    });

    if (!nextEvent) {
      throw new Error('No upcoming events found');
    }

    return nextEvent;
  } catch (error: any) {
    // console.error("Error fetching next event:", error.message || error);
    // throw new Error(error.message || "Failed to fetch next event");
  }
};