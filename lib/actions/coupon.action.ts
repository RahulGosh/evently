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
        code: coupon.code.toUpperCase().trim(),
        discount: coupon.discount,
        isPercentage: coupon.isPercentage,
        maxUses: coupon.maxUses,
        startDate: coupon.startDate || new Date(), // Default to now if not provided
        endDate: coupon.endDate,
        eventId: coupon.eventId,
        isActive: true, // Explicitly set to active
        currentUses: 0,  // Explicit default
      },
    });

    revalidatePath(`/events/${coupon.eventId}`);
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
    const coupon = await db.coupon.findFirst({
      where: {
        code: normalizedCode,
        eventId,
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
    });

    if (!coupon) {
      // Debug why not found
      const inactiveCoupon = await db.coupon.findFirst({
        where: {
          code: normalizedCode,
          eventId,
          isActive: false
        }
      });

      const dateIssueCoupon = await db.coupon.findFirst({
        where: {
          code: normalizedCode,
          eventId,
          isActive: true,
          OR: [
            { startDate: { gt: now } },
            { endDate: { lt: now } }
          ]
        }
      });

      console.log('=== VALIDATION FAILURE REASON ===', {
        couponExists: !!inactiveCoupon || !!dateIssueCoupon,
        isActive: inactiveCoupon?.isActive,
        startDate: dateIssueCoupon?.startDate?.toISOString(),
        endDate: dateIssueCoupon?.endDate?.toISOString(),
        currentTime: now.toISOString()
      });

      return {
        valid: false,
        message: "Invalid coupon code or expired",
        coupon: null,
      };
    }

    // Check usage limits
    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      console.log('Usage limit reached:', {
        currentUses: coupon.currentUses,
        maxUses: coupon.maxUses
      });
      return {
        valid: false,
        message: "Coupon has reached its usage limit",
        coupon: null,
      };
    }

    console.log('=== COUPON VALIDATION DETAILS ===', {
      normalizedCode,
      eventId,
      currentTime: now.toISOString(),
      foundCoupon: coupon ? {
        id: coupon.id,
        code: coupon.code,
        isActive: coupon.isActive,
        startDate: coupon.startDate.toISOString(),
        endDate: coupon.endDate?.toISOString() || null,
        maxUses: coupon.maxUses,
        currentUses: coupon.currentUses,
        eventId: coupon.eventId
      } : null
    });

    console.log('=== VALIDATION SUCCESS ===', {
      couponCode: coupon.code,
      discount: coupon.discount,
      isPercentage: coupon.isPercentage
    });

    return {
      valid: true,
      message: "Coupon code is valid",
      coupon,
    };
  } catch (error: any) {
    console.error("VALIDATION ERROR:", error);
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
  try {
    const { valid, message, coupon } = await validateCoupon({ code, eventId });

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