"use client"

import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'
import { useSession } from 'next-auth/react'
import { Event } from '@prisma/client'

const CheckoutButton = ({ event }: { event: Event }) => {
  const {data: session} = useSession()
  const userId = session?.user?.id;
  const hasEventFinished = new Date(event.endDateTime) < new Date();

  return (
    <div className="flex items-center gap-3">
      {hasEventFinished ? (
        <p className="p-2 text-red-400">Sorry, tickets are no longer available.</p>
      ): (
        <>
            <Button asChild className="button rounded-full" size="lg">
              <Link href="/sign-in">
                Get Tickets
              </Link>
            </Button>

            {/* <Checkout event={event} userId={userId} /> */}
        </>
      )}
    </div>
  )
}

export default CheckoutButton