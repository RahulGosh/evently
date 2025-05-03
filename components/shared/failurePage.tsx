import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function FailurePage({ orderId, message }: { 
  orderId: string;
  message?: string 
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-lg text-gray-600 mb-4">
          {message || "We couldn't process your payment. Please try again."}
        </p>
        
        {orderId && (
          <p className="text-sm text-gray-500 mb-6">
            Reference: #{orderId.slice(0, 8)}
          </p>
        )}
        
        <div className="bg-gray-50 p-6 rounded-lg mb-8 text-left">
          <h2 className="text-xl font-semibold mb-4">What to do next?</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li>Check your payment method details and try again</li>
            <li>Contact your bank if you suspect any issues</li>
            <li>Try a different payment method</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/events" 
            className={buttonVariants({ variant: "outline" })}
          >
            Browse Events
          </Link>
          <Link 
            href="/support" 
            className={buttonVariants({ variant: "destructive" })}
          >
            Contact Support
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>No charges were made to your account.</p>
          <p>If you see a charge, it will be refunded within 5-7 business days.</p>
        </div>
      </div>
    </div>
  );
}