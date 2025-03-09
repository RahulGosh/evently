"use client";

import { use, useState, useEffect } from "react";
import EventForm from "@/components/shared/eventForm";
import { getEventById } from "@/lib/actions/event.action";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; // Import router for redirection
import LoadingLogo from "@/components/shared/loadingLogo";

type UpdateEventProps = {
  params: Promise<{ id: string }>; // Marking params as a Promise
};

const UpdateEvent = ({ params }: UpdateEventProps) => {
  const resolvedParams = use(params); // Unwrap params using use()
  const { data: session } = useSession();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    
    const fetchEvent = async () => {
      try {
        const eventData = await getEventById(resolvedParams.id);
        setEvent(eventData);
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };

    if (resolvedParams.id) {
      fetchEvent();
    }
  }, [resolvedParams.id]);

  if (loading) return <LoadingLogo />;

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Update Event</h3>
      </section>

      <div className="wrapper my-8">
        {event ? (
          <EventForm type="Update" event={event} eventId={event.id} userId={session?.user?.id as string} />
        ) : (
          <p>Event not found</p>
        )}
      </div>
    </>
  );
};

export default UpdateEvent;
