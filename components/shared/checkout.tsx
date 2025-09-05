"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Event } from "@prisma/client";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "../ui/input";
import { applyCoupon } from "@/lib/actions/coupon.action";
import { X, Minus, Plus, Ticket } from "lucide-react";
import { checkoutOrder } from "@/lib/actions/order.action";

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

  const calculateTotal = () => {
    const baseTotal = Number(event.price) * quantity;
    return Math.max(baseTotal - discountAmount, 0);
  };

  const resetCoupon = () => {
    setCouponApplied(false);
    setDiscountAmount(0);
    setCouponCode("");
    setError(null);
  };

  const handleApplyCoupon = async () => {
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
        quantity,
      });
      if (result.valid) {
        setDiscountAmount(Number(result.discountAmount));
        setCouponApplied(true);
      } else {
        resetCoupon();
        setError(result.message || "Invalid coupon code");
      }
    } catch {
      resetCoupon();
      setError("Failed to apply coupon. Please try again.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const onCheckout = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const order = {
        eventTitle: event.title,
        eventId: event.id,
        price: event.price,
        isFree: event.isFree,
        buyerId: userId,
        quantity,
        code: couponApplied ? couponCode : undefined,
      };
      const result = await checkoutOrder(order);
      if (result?.url) window.location.href = result.url;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Button
          className="button sm:w-fit"
          size="lg"
          onClick={() => setIsDialogOpen(true)}
        >
          Buy Now
        </Button>

        <AlertDialogContent className="bg-white rounded-2xl p-6 shadow-xl max-w-md mx-auto">
          {/* Icon + Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
              <Ticket className="w-6 h-6" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold text-gray-900">
                Select Your Tickets
              </AlertDialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {event.isFree
                  ? "Reserve your free tickets"
                  : "Choose the number of tickets and apply coupon if available"}
              </p>
            </AlertDialogHeader>
          </div>

          {/* Ticket Quantity */}
          <div className="mt-6 flex items-center justify-between border rounded-lg px-4 py-3">
            <span className="font-medium text-gray-700">Quantity</span>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold w-6 text-center">
                {quantity}
              </span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity((q) => Math.min(maxTickets, q + 1))}
                disabled={quantity >= maxTickets}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Coupon */}
          {!event.isFree && (
            <div className="mt-5">
              {couponApplied ? (
                <div className="flex items-center justify-between bg-green-100 text-green-700 px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium">
                    Coupon Applied: {couponCode}
                  </span>
                  <button onClick={resetCoupon}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    className="flex-1"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    variant="secondary"
                  >
                    {isApplyingCoupon ? "..." : "Apply"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Price Summary */}
          {!event.isFree && (
            <div className="mt-6 space-y-2 bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${(Number(event.price) * quantity).toFixed(2)}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>- ${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t font-semibold text-gray-900">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialogCancel className="px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onCheckout}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Confirm & Pay"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Checkout;
