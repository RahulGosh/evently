"use client"

import React from 'react';
import EventForm from '@/components/shared/eventForm';
import { useSession } from 'next-auth/react';

const CreateEvent = () => {
  const { data: session } = useSession(); // Get session data
  const userId = session?.user.id;

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Create Event</h3>
      </section>

      <div className="wrapper my-8">
        <EventForm type="Create" userId={userId ?? ""} />
      </div>
    </>
  );
};

export default CreateEvent;