"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardDescription, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const sessionId = searchParams.get('session_id');

  const errorMessages = {
    default: "Your payment could not be processed. Please try again.",
    coupon: "The coupon code you used is invalid or expired.",
    tickets: "The event tickets are no longer available.",
    payment: "The payment was not successful.",
    verification: "We couldn't verify your payment details.",
  };

  const getErrorMessage = () => {
    if (!error) return errorMessages.default;
    if (error.includes('coupon')) return errorMessages.coupon;
    if (error.includes('ticket')) return errorMessages.tickets;
    if (error.includes('payment')) return errorMessages.payment;
    if (error.includes('verify')) return errorMessages.verification;
    return errorMessages.default;
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <Card className="border-red-200">
        <CardHeader className="bg-red-50 text-red-700">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-10 w-10" />
            <div>
              <CardTitle className="text-2xl md:text-3xl">Payment Failed</CardTitle>
              <CardDescription className="text-red-600">
                We couldn't complete your order
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {getErrorMessage()}
                </p>
                {sessionId && (
                  <p className="text-xs mt-2 text-red-600">
                    Reference: {sessionId}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="text-lg font-semibold mb-3">What to do next?</h3>
            <ul className="space-y-3 list-disc pl-5">
              <li>Check your payment method and try again</li>
              <li>Contact your bank if you see any charges</li>
              <li>Try a different payment method</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button asChild variant="outline">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto p-8">Loading payment status...</div>}>
      <PaymentFailContent />
    </Suspense>
  );
}