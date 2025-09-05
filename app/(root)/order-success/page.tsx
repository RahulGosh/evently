"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, CalendarDays, MapPin, Share2 } from "lucide-react";
import { verifyOrder } from "@/lib/actions/order.action";
import toast from "react-hot-toast";
import { sendTicketEmail } from "@/lib/actions/ticket.action";
import { TwitterShareButton } from "react-share";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { VerifyOrderResponse } from "@/types";

type OrderWithEvent = {
  id: string;
  createdAt: Date;
  stripeId: string;
  totalAmount: string;
  eventId: string;
  buyerId: string;
  quantity: number;
  discountAmount?: string;
  event: {
    id: string;
    title: string;
    description?: string;
    startDateTime: Date;
    endDateTime: Date;
    location?: string;
    imageUrl: string;
    url?: string;
    organizer: {
      id: string;
      name?: string;
    };
  };
  coupon?: {
    code: string;
    discount: number;
    isPercentage: boolean;
  };
};

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session_id = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderWithEvent | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleShare = async () => {
    try {
      const eventUrl = `${window.location.origin}/events/${order?.event.id}`;

      if (navigator.share) {
        await navigator.share({
          title: order?.event.title,
          text: `Check out this event: ${order?.event.title}`,
          url: eventUrl,
        });
        setIsShareOpen(false);
      } else {
        setIsShareOpen((prev) => !prev);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setIsShareOpen((prev) => !prev);
    }
  };

  const handleSendTicket = async () => {
    if (!order) return;

    setIsSending(true);
    try {
      const result = await sendTicketEmail({
        eventId: order.eventId,
        orderId: order.id,
        userId: order.buyerId
      });

      if (result.success) {
        toast.success(result.message, {
          duration: 4000,
          position: "top-center",
          icon: (
            <img
              src="/assets/icons/green-ticket.png"
              alt="Ticket"
              className="w-6 h-6"
            />
          ),
        });
      } else {
        toast.error(result.message || "Failed to send ticket", {
          duration: 4000,
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Send ticket error:", error);
      toast.error("Failed to send ticket. Please try again.", {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!session_id) {
      router.push('/');
      return;
    }

    const fetchOrderData = async () => {
      try {
        const result: VerifyOrderResponse = await verifyOrder(session_id);

        if (!result.success) {
          const errorParam = result.errorType || 'payment_failed';
          router.push(`/order-fail?session_id=${session_id}&error=${errorParam}`);
          return;
        }

        if (result.order) {
          setOrder(result?.order as OrderWithEvent);
        } else if (result.session?.payment_status === 'paid') {
          setSessionData(result.session);
        } else {
          router.push(`/order-fail?session_id=${session_id}&error=payment_failed`);
        }
      } catch (err: any) {
        console.error("Error in fetchOrderData:", err);
        router.push(`/order-fail?session_id=${session_id}&error=verification_failed`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [session_id, router]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <Card className="border-red-200">
          <CardHeader className="bg-red-50 text-red-700">
            <CardTitle>Error Loading Order</CardTitle>
            <CardDescription className="text-red-600">
              We encountered a problem retrieving your order
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p>{error}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link href="/">Return to Home</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (order) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-10 w-10" />
              <div>
                <CardTitle className="text-2xl md:text-3xl">Order Confirmed!</CardTitle>
                <CardDescription className="text-green-100">
                  Your tickets are ready
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid md:grid-cols-3 gap-6 p-6">
            {/* Left Column - Event Details */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-start gap-4">
                {order.event.imageUrl && (
                  <img
                    src={order.event.imageUrl}
                    alt={order.event.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h2 className="text-xl font-bold">{order.event.title}</h2>
                  <p className="text-gray-600">{order.event.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Organized by {order.event.organizer.name || "Event Organizer"}
                  </p>
                </div>
              </div>

              {/* Event Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <CalendarDays className="h-5 w-5" />
                      <span className="font-medium">Date & Time</span>
                    </div>
                    <p className="mt-2">
                      {format(order.event.startDateTime, "MMMM d, yyyy")}
                      <br />
                      {format(order.event.startDateTime, "h:mm a")} -{" "}
                      {format(order.event.endDateTime, "h:mm a")}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-5 w-5" />
                      <span className="font-medium">Location</span>
                    </div>
                    <p className="mt-2">
                      {order.event.location || "Online Event"}
                      {order.event.url && (
                        <a
                          href={order.event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline block mt-1"
                        >
                          Join Online
                        </a>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Calendar Component */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add to Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={order.event.startDateTime}
                    disabled={(date) =>
                      date < new Date() ||
                      date > order.event.endDateTime
                    }
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {order.quantity} x Ticket
                    </span>
                    <span>₹{order.totalAmount}</span>
                  </div>
                  {order.coupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({order.coupon.code})</span>
                      <span>-₹{order.discountAmount || '0'}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                    <span>Total Paid</span>
                    <span>₹{order.totalAmount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Ticket & Actions */}
            <div className="space-y-6">
              <Button
                onClick={handleSendTicket}
                disabled={isSending}
                variant="outline"
                className="w-full"
              >
                {isSending ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    Send Ticket to Email
                  </>
                )}
              </Button>

              {/* Share Button */}
              <Popover open={isShareOpen} onOpenChange={setIsShareOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleShare}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share This Event
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                  <div className="flex flex-col space-y-2">
                    {/* Twitter Share */}
                    <TwitterShareButton
                      url={`${window.location.origin}/events/${order?.event.id}`}
                      title={order?.event.title}
                      className="w-full"
                    >
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                        </svg>
                        <span>Twitter</span>
                      </div>
                    </TwitterShareButton>

                    {/* WhatsApp Share */}
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out this event: ${order?.event.title} - ${window.location.origin}/events/${order?.event.id}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-6.29 3.01c1.175-1.37 1.947-2.293 2.622-3.45.455-.777.792-1.627.792-1.627s-.397.126-1.092.315c-.713.197-1.588.31-1.588.31S11.5 9.777 11.5 8.91v-.464s-2.004.398-2.92 1.213c-.916.816-1.15 1.86-1.15 1.86s.607 3.028 3.786 5.054M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20m0-22a12 12 0 1 0 0 24 12 12 0 0 0 0-24" />
                        </svg>
                        <span>WhatsApp</span>
                      </div>
                    </a>

                    {/* Copy Link */}
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/events/${order?.event.id}`);
                        toast.success('Event link copied to clipboard!', {
                          duration: 2000,
                          position: 'top-center'
                        });
                        setIsShareOpen(false);
                      }}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Event Link
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Actions */}
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/protected/profile">View All Orders</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionData) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <Card>
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-t-lg">
            <div className="flex items-center gap-4">
              <Clock className="h-10 w-10" />
              <div>
                <CardTitle className="text-2xl md:text-3xl">Payment Processed</CardTitle>
                <CardDescription className="text-amber-100">
                  Your order is being confirmed
                </CardDescription>
              </div>
            </div>
          </CardHeader>

        <CardContent className="p-6 space-y-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Your payment was successful but we're still processing your order.
                    You'll receive a confirmation email shortly. If you don't see it
                    within 24 hours, please contact support.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Payment Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Reference Number</p>
                  <p className="font-mono text-sm">{sessionData.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount Paid</p>
                  <p className="font-medium">
                    ₹{(sessionData.amount_total ? sessionData.amount_total / 100 : 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Event</p>
                  <p className="font-medium">{sessionData.metadata?.eventTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tickets</p>
                  <p className="font-medium">{sessionData.metadata?.quantity}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-3">What to do next?</h3>
              <ul className="space-y-3 list-disc pl-5">
                <li>Check your email for confirmation (including spam folder)</li>
                <li>Wait up to 24 hours for order processing</li>
                <li>
                  Contact support if you don't receive confirmation with your reference
                  number
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="bg-primary hover:bg-primary-dark">
                <Link href="/protected/profile">Check Your Orders</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto p-4 md:p-8 flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment status...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}