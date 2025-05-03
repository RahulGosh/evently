import * as z from "zod";

// Schema for individual coupon
const couponSchema = z.object({
  code: z.string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(20, "Coupon code must be less than 20 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Coupon code can only contain letters and numbers"),
  discount: z.coerce.number()
    .min(1, "Discount must be at least 1")
    .max(100, "Discount cannot exceed 100"),
  isPercentage: z.boolean().default(true),
  maxUses: z.coerce.number()
    .min(1, "Max uses must be at least 1")
    .optional()
    .nullable(),
  startDate: z.date(),
  endDate: z.date()
    .optional()
    .nullable()
    .refine(date => !date || date > new Date(), {
      message: "End date must be in the future"
    }),
});

export const eventFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters")
    .max(400, "Description must be less than 400 characters"),
  location: z
    .string()
    .min(3, "Location must be at least 3 characters")
    .max(400, "Location must be less than 400 characters"),
  imageUrl: z.string(),
  startDateTime: z.date(),
  endDateTime: z.date()
    .refine(date => date > new Date(), {
      message: "End date must be in the future"
    })
    // For cross-field validation, we'll handle this in superRefine
    ,
  categoryId: z.string(),
  price: z.string()
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Price must be a number"
    }),
  isFree: z.boolean(),
  url: z.string().url(),
  ticketsLeft: z.number()
    .min(1, "Tickets left must be at least 1")
    .default(10),
  
  // Early Bird Discount Fields
  earlyBirdDiscount: z.coerce.number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .optional(),
  earlyBirdIsPercentage: z.boolean().default(true),
  earlyBirdEndDate: z.date()
    .optional()
    // For cross-field validation, we'll handle this in superRefine
    ,
  earlyBirdTicketsLimit: z.coerce.number()
    .min(1, "Ticket limit must be at least 1")
    .optional(),
    
  // Coupons Array
  coupons: z.array(couponSchema)
    .optional()
    .refine(coupons => {
      if (!coupons) return true;
      const codes = coupons.map(c => c.code.toLowerCase());
      return new Set(codes).size === codes.length;
    }, {
      message: "Coupon codes must be unique"
    })
}).superRefine((data, ctx) => {
  // Validate end date is after start date
  if (data.endDateTime <= data.startDateTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be after start date",
      path: ["endDateTime"]
    });
  }

  // Validate early bird discount has end date if discount is set
  if (data.earlyBirdDiscount && data.earlyBirdDiscount > 0 && !data.earlyBirdEndDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Early bird discount requires an end date",
      path: ["earlyBirdEndDate"]
    });
  }

  // Validate early bird end date is before event starts and in the future
  if (data.earlyBirdEndDate) {
    if (data.earlyBirdEndDate <= new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Early bird must end in the future",
        path: ["earlyBirdEndDate"]
      });
    }
    if (data.earlyBirdEndDate >= data.startDateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Early bird must end before event starts",
        path: ["earlyBirdEndDate"]
      });
    }
  }

  // Validate fixed amount discount doesn't exceed price
  if (data.earlyBirdDiscount && !data.earlyBirdIsPercentage && !data.isFree) {
    const priceNum = parseFloat(data.price);
    if (data.earlyBirdDiscount >= priceNum) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fixed discount cannot exceed ticket price",
        path: ["earlyBirdDiscount"]
      });
    }
  }
});