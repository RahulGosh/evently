"use client";

import React from "react";
import EventForm from "@/components/shared/eventForm";
import { useSession } from "next-auth/react";

const CreateEvent = () => {
  const { data: session, status } = useSession();

  // Show a loading message while session data is being fetched
  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">
          Create Event
        </h3>
      </section>

      <div className="wrapper my-8">
        {/* Ensure session.user exists before passing userId */}
        <EventForm type="Create" userId={session?.user?.id ?? ""} />
      </div>
    </>
  );
};

export default CreateEvent;
