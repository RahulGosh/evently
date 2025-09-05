// ====== USER PARAMS
export type CreateUserParams = {
  clerkId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  photo: string;
};

export type UpdateUserParams = {
  firstName: string;
  lastName: string;
  username: string;
  photo: string;
};

// ====== EVENT PARAMS
export type CreateEventParams = {
  userId: string;
  event: {
    title: string;
    description: string;
    location: string;
    imageUrl: string;
    startDateTime: Date;
    endDateTime: Date;
    categoryId: string;
    price: string;
    isFree: boolean;
    url: string;
    ticketsLeft: number;
  };
  path: string;
};

export type UpdateEventParams = {
  userId: string;
  event: {
    _id: string;
    title: string;
    imageUrl: string;
    description: string;
    location: string;
    startDateTime: Date;
    endDateTime: Date;
    categoryId: string;
    price: string;
    isFree: boolean;
    url: string;
  };
  path: string;
};

export type DeleteEventParams = {
  eventId: string;
  path: string;
};

export type GetAllEventsParams = {
  query: string;
  category: string;
  limit: number;
  page: number;
};

export type GetEventsByUserParams = {
  userId: string;
  limit?: number;
  page: number;
};

export type GetRelatedEventsByCategoryParams = {
  categoryId: string;
  eventId: string;
  limit?: number;
  page: number | string;
};

export type Event = {
  _id: string;
  title: string;
  description: string;
  price: string;
  isFree: boolean;
  imageUrl: string;
  location: string;
  startDateTime: Date;
  endDateTime: Date;
  url: string;
  organizer: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  category: {
    _id: string;
    name: string;
  };
};

// ====== CATEGORY PARAMS
export type CreateCategoryParams = {
  categoryName: string;
};

export type GetOrdersByEventParams = {
  eventId: string;
  searchString?: string;
  sort?: 'asc' | 'desc';
};

export type GetAllUsersParams = {
  searchString?: string;
  role?: "ADMIN" | "USER" | "EMPLOYER";
}


export type GetOrdersByUserParams = {
  userId: string | null;
  limit?: number;
  page: string | number | null;
};

// ====== URL QUERY PARAMS
export type UrlQueryParams = {
  params: string;
  key: string;
  value: string | null;
};

export type RemoveUrlQueryParams = {
  params: string;
  keysToRemove: string[];
};

export type SearchParamProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export type EventDetailSearchParamProps = {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export type ScannedTicketWithRelations = TicketScan & {
  scanner?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  order?: {
    buyer: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  };
};

import { Order, TicketScan, User } from "@prisma/client";
import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Email is required" }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

export const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const HostApplicationSchema = z.object({
  organizationName: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  governmentIdUrl: z.string().url().optional(),
  pastEvents: z.string().optional(),
  whyHosting: z.string(),
  expectedAudience: z.string().optional(),
  eventType: z.string().optional(),
});

export type CheckoutOrderParams = {
  eventId: string;
  eventTitle: string;
  price: string; // Base price as string (e.g., "100.00")
  isFree: boolean;
  buyerId: string;
  quantity: number;
  // Coupon and Discount Fields
  code?: string; // Optional coupon code
  discountAmount?: string; // Applied discount amount
  // Early Bird Tracking
  isEarlyBird?: boolean; // Whether early bird discount was applied
  earlyBirdDiscount?: string; // Early bird discount amount if applied
};

export type CreateOrderParams = {
  stripeId: string;
  eventId: string;
  buyerId: string;
  totalAmount: string; // Final amount after all discounts
  quantity: number;
  // Discount Tracking Fields
  discountAmount?: string; // Total discount applied
  couponId?: string; // ID of applied coupon (if any)
  isEarlyBird?: boolean; // Whether early bird discount was applied
  earlyBirdDiscount?: string; // Early bird discount amount if applied
  barcodeId?: string; // Optional barcode/ticket ID
};

// New coupon-related types
export type Coupon = {
  id: string;
  code: string;
  discount: number;
  isPercentage: boolean;
  maxUses?: number | null;
  currentUses: number;
  startDate: Date;
  endDate?: Date | null;
  isActive: boolean;
  eventId: string;
};

export type CreateCouponParams = {
  code: string;
  discount: number;
  isPercentage: boolean;
  maxUses?: number | null;
  startDate?: Date;
  endDate?: Date | null;
  eventId: string;
};

export type ValidateCouponResult = {
  valid: boolean;
  message: string;
  coupon: Coupon | null;
};

export type ApplyCouponResult = {
  valid: boolean;
  message: string;
  originalPrice: string;
  discountedPrice: string;
  discountAmount: string;
  couponId: string | null;
};

// Extended types with coupon support
export type CheckoutOrderWithCouponParams = CheckoutOrderParams & {
  code?: string;
};

export type CreateOrderWithCouponParams = CreateOrderParams & {
  couponId?: string;
  discountAmount?: string;
};

export type OrderWithCoupon = {
  id: string;
  stripeId: string;
  totalAmount: string;
  discountAmount?: string;
  eventId: string;
  buyerId: string;
  quantity: number;
  createdAt: Date;
  couponId?: string;
  coupon?: Coupon;
};


export type OrderWithEvent = {
  id: string;
  createdAt: Date;
  stripeId: string;
  totalAmount: string;
  eventId: string;
  buyerId: string;
  quantity: number;
  barcodeId?: string | null;
  couponId?: string | null;
  discountAmount?: string | null;
  event: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    imageUrl: string;
    startDateTime: Date;
    endDateTime: Date;
    price: string;
    isFree: boolean;
    url?: string | null;
    ticketsLeft: number;
    category?: {
      id: string;
      name: string;
    } | null;
    organizer: {
      id: string;
      name?: string | null;
      email?: string | null;
    };
  };
  buyer: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  coupon?: {
    id: string;
    code: string;
    discount: number;
    isPercentage: boolean;
    maxUses?: number | null;
    currentUses: number;
    startDate: Date;
    endDate?: Date | null;
    isActive: boolean;
    eventId: string;
  } | null;
};

export type VerifyOrderResponse = {
  success: boolean;
  message?: string;
  error?: string;
  errorType?: "payment_failed" | "metadata_missing" | "verification_error";
  sessionId?: string;
  amount?: number;
  order?: OrderWithEvent;
  session?: any;
};