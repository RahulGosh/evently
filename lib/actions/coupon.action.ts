"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type CreateCouponParams = {
  code: string;
  discount: number;
  isPercentage: boolean;
  maxUses?: number | null;
  startDate?: Date;
  endDate?: Date | null;
  eventId: string;
};

export type ValidateCouponParams = {
  code: string;
  eventId: string;
};

export type ApplyCouponParams = {
  code: string;
  eventId: string;
  price: string;
  quantity: number;
};

// Create a new coupon for an event
export const createCoupon = async (coupon: CreateCouponParams) => {
  try {
    // Verify the event exists
    const event = await db.event.findUnique({
      where: { id: coupon.eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    // Check if coupon code already exists for this event
    const existingCoupon = await db.coupon.findFirst({
      where: {
        code: coupon.code,
        eventId: coupon.eventId,
      },
    });

    if (existingCoupon) {
      throw new Error("Coupon code already exists for this event");
    }

    // Create the coupon
    const newCoupon = await db.coupon.create({
      data: {
        code: coupon.code.toUpperCase().trim(), // Normalize case
        discount: coupon.discount,
        isPercentage: coupon.isPercentage,
        maxUses: coupon.maxUses,
        startDate: coupon.startDate || new Date(),
        endDate: coupon.endDate,
        eventId: coupon.eventId,
        isActive: true, // Explicitly set to active
        currentUses: 0, // Explicit default
      },
    });

    revalidatePath(`/admin/events/${coupon.eventId}`);
    return newCoupon;
  } catch (error: any) {
    console.error("Error creating coupon:", error.message || error);
    throw new Error(error.message || "Failed to create coupon");
  }
};

// Get all coupons for an event
export const getCouponsByEvent = async (eventId: string) => {
    try {
      const coupons = await db.coupon.findMany({
        where: {
          eventId,
        },
        orderBy: {
          createdAt: "desc", // Now this will work
        },
      });
      console.log(coupons, "coupons")
      return coupons;
    } catch (error: any) {
      console.error("Error fetching coupons:", error.message || error);
      throw new Error(error.message || "Failed to fetch coupons");
    }
  };
  

// Validate a coupon code for an event
export const validateCoupon = async ({ code, eventId }: ValidateCouponParams) => {
  const normalizedCode = code.trim().toUpperCase();
  const now = new Date();
  
  console.log('=== VALIDATION PARAMETERS ===', {
    normalizedCode,
    eventId,
    currentTime: now.toISOString()
  });

  try {
    // First check if coupon exists at all
    const coupon = await db.coupon.findFirst({
      where: {
        code: normalizedCode,
        eventId,
      },
    });

    if (!coupon) {
      console.log('Coupon not found in database');
      return {
        valid: false,
        message: "Coupon code not found",
        coupon: null,
      };
    }

    // Then check all validation conditions
    const isValid = 
      coupon.isActive &&
      coupon.startDate <= now &&
      (coupon.endDate === null || coupon.endDate >= now) &&
      (coupon.maxUses === null || coupon.currentUses < coupon.maxUses);

    if (!isValid) {
      console.log('Coupon validation failed:', {
        isActive: coupon.isActive,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        currentTime: now,
        maxUses: coupon.maxUses,
        currentUses: coupon.currentUses
      });

      let message = "Coupon is not valid";
      if (!coupon.isActive) message = "Coupon is inactive";
      else if (coupon.startDate > now) message = "Coupon not yet started";
      else if (coupon.endDate && coupon.endDate < now) message = "Coupon has expired";
      else if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
        message = "Coupon usage limit reached";
      }

      return {
        valid: false,
        message,
        coupon: null,
      };
    }

    console.log('Coupon validation successful:', coupon);
    return {
      valid: true,
      message: "Coupon is valid",
      coupon,
    };
  } catch (error: any) {
    console.error("Coupon validation error:", error);
    return {
      valid: false,
      message: "Error validating coupon",
      coupon: null,
    };
  }
};

// Calculate final price after applying coupon
// Calculate final price after applying coupon
// Calculate final price after applying coupon
export const applyCoupon = async ({ code, eventId, price, quantity }: ApplyCouponParams) => {
  console.log('=== APPLY COUPON PARAMS ===', {
    code,
    eventId,
    price,
    quantity
  });

  try {
    const { valid, message, coupon } = await validateCoupon({ code, eventId });
    
    console.log('=== VALIDATION RESULT ===', {
      valid,
      message,
      coupon: coupon ? {
        id: coupon.id,
        code: coupon.code,
        discount: coupon.discount,
        isPercentage: coupon.isPercentage
      } : null
    });

    if (!valid || !coupon) {
      return {
        valid: false,
        message: message || "Invalid coupon code",
        originalPrice: (Number(price) * quantity).toFixed(2),
        discountedPrice: (Number(price) * quantity).toFixed(2),
        discountAmount: "0.00",
        couponId: null,
      };
    }

    const originalPricePerTicket = parseFloat(price);
    const totalOriginalPrice = originalPricePerTicket * quantity;
    let totalDiscountAmount = 0;

    if (coupon.isPercentage) {
      // PERCENTAGE: discount applies to the total order amount
      totalDiscountAmount = (totalOriginalPrice * coupon.discount) / 100;
    } else {
      // FIXED AMOUNT: flat discount regardless of quantity (but not exceeding total)
      totalDiscountAmount = Math.min(coupon.discount, totalOriginalPrice);
    }

    // Calculate final price after discount
    const totalDiscountedPrice = Math.max(totalOriginalPrice - totalDiscountAmount, 0);
    
    // Calculate effective price per ticket after discount
    const discountedPricePerTicket = totalDiscountedPrice / quantity;

    return {
      valid: true,
      message: `Applied ${coupon.isPercentage ? 
               `${coupon.discount}% off` : 
               `Flat ₹${coupon.discount} off`}`,
      originalPrice: totalOriginalPrice.toFixed(2),
      discountedPrice: totalDiscountedPrice.toFixed(2),
      discountAmount: totalDiscountAmount.toFixed(2),
      discountedPricePerTicket: discountedPricePerTicket.toFixed(2),
      couponId: coupon?.id,
    };
  } catch (error: any) {
    console.error("Error applying coupon:", error.message || error);
    throw new Error(error.message || "Failed to apply coupon");
  }
};

// Update coupon usage count
export const incrementCouponUsage = async (couponId: string) => {
  try {
    await db.coupon.update({
      where: { id: couponId },
      data: {
        currentUses: {
          increment: 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Error updating coupon usage:", error.message || error);
    throw new Error(error.message || "Failed to update coupon usage");
  }
};

// Delete a coupon
export const deleteCoupon = async (couponId: string) => {
  try {
    await db.coupon.delete({
      where: { id: couponId },
    });
  } catch (error: any) {
    console.error("Error deleting coupon:", error.message || error);
    throw new Error(error.message || "Failed to delete coupon");
  }
};

// Update coupon status (activate/deactivate)
export const updateCouponStatus = async (couponId: string, isActive: boolean) => {
  try {
    await db.coupon.update({
      where: { id: couponId },
      data: { isActive },
    });
  } catch (error: any) {
    console.error("Error updating coupon status:", error.message || error);
    throw new Error(error.message || "Failed to update coupon status");
  }
};

// Add this function to your coupon actions
export const addCouponsToEvent = async (eventId: string, coupons: CreateCouponParams[]) => {
  try {
    if (!eventId) throw new Error("Event ID is required");
    if (!coupons?.length) return [];

    console.log('Adding coupons to event:', eventId, coupons);

    // Verify event exists
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error("Event not found");

    // Check for duplicate codes in this batch
    const couponCodes = coupons.map((c) => c.code);
    if (new Set(couponCodes).size !== couponCodes.length) {
      throw new Error("Duplicate coupon codes in this request");
    }

    // Check for existing coupons with same codes for this event
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
            isActive: true,
            currentUses: 0,
          },
        })
      )
    );

    revalidatePath(`/admin/events/${eventId}`);
    return createdCoupons;
  } catch (error: any) {
    console.error("Error adding coupons to event:", error);
    throw new Error(error.message || "Failed to add coupons to event");
  }
};