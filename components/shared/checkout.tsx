"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Event } from "@prisma/client";
import { checkoutOrder } from "@/lib/actions/order.action";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";
import { applyCoupon } from "@/lib/actions/coupon.action";
import { X } from "lucide-react"; // Import X icon for the remove button

loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const Checkout = ({ event, userId }: { event: Event; userId?: string }) => {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const router = useRouter();

  const maxTickets = Math.min(5, event.ticketsLeft);
  const ticketOptions = Array.from({ length: maxTickets }, (_, i) => i + 1);

  const calculateTotal = () => {
    const baseTotal = Number(event.price) * quantity;
    const total = baseTotal - discountAmount;
    return Math.max(total, 0);
  };

  const resetCoupon = () => {
    setCouponApplied(false);
    setDiscountAmount(0);
    setCouponCode("");
    setError(null);
  };

  const handleApplyCoupon = async () => {
    console.log('Applying coupon:', couponCode);
    
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }
  
    setIsApplyingCoupon(true);
    setError(null);
    
    try {
      const result = await applyCoupon({
        code: couponCode.trim(),
        eventId: event.id,
        price: event.price,
        quantity: quantity
      });
      
      console.log('Full coupon result:', JSON.stringify(result, null, 2));
      
      if (result.valid) {
        setDiscountAmount(Number(result.discountAmount));
        setCouponApplied(true);
      } else {
        resetCoupon();
        setError(result.message || "Invalid coupon code");
      }
    } catch (error) {
      console.error("Detailed coupon error:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      resetCoupon();
      setError("Failed to apply coupon. Please try again.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    resetCoupon();
  };

  const handleQuantityChange = (value: string) => {
    const newQuantity = parseInt(value);
    setQuantity(newQuantity);
    if (couponApplied) {
      resetCoupon();
    }
  };

  const onCheckout = async () => {
    if (quantity > event.ticketsLeft) {
      setError(`Only ${event.ticketsLeft} tickets left!`);
      return;
    }

    if (!userId) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setError(null);

    const order = {
      eventTitle: event.title,
      eventId: event.id,
      price: event.price,
      isFree: event.isFree,
      buyerId: userId,
      quantity: quantity,
      code: couponApplied ? couponCode : undefined,
    };

    try {
      const result = await checkoutOrder(order);
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNowClick = () => {
    if (!userId) {
      router.push("/login");
    } else {
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Button
          className="button sm:w-fit"
          size="lg"
          onClick={handleBuyNowClick}
        >
          Buy Now
        </Button>

        <AlertDialogContent className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6 border border-gray-300 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select Number of Tickets
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
              {event.isFree
                ? "How many free tickets would you like to reserve?"
                : "How many tickets would you like to purchase?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <RadioGroup
              defaultValue="1"
              onValueChange={handleQuantityChange}
              className="flex flex-col space-y-2"
            >
              {ticketOptions.map((num) => (
                <div
                  key={num}
                  className="flex items-center justify-between space-x-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={num.toString()}
                      id={`ticket-${num}`}
                    />
                    <Label
                      htmlFor={`ticket-${num}`}
                      className="text-gray-900 dark:text-gray-100"
                    >
                      {num} {num === 1 ? "Ticket" : "Tickets"}
                    </Label>
                  </div>
                  {!event.isFree && (
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      ${(Number(event.price) * num).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </RadioGroup>

            {!event.isFree && (
              <>
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={isApplyingCoupon || couponApplied}
                      className="flex-1"
                    />
                    {couponApplied ? (
                      <Button
                        onClick={handleRemoveCoupon}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <X size={16} /> Remove
                      </Button>
                    ) : (
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        size="sm"
                        variant="outline"
                      >
                        {isApplyingCoupon ? "Applying..." : "Apply"}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 p-3 bg-gray-200 dark:bg-gray-700 rounded-md">
                  <div className="flex justify-between text-gray-900 dark:text-gray-100">
                    <span>Subtotal:</span>
                    <span>${(Number(event.price) * quantity).toFixed(2)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount:</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100 border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mt-2 p-3 bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={loading}
              className="text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={onCheckout}
              disabled={loading}
            >
              {loading ? "Processing..." : "Buy Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Checkout;