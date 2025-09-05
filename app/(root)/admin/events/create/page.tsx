import { currentUser } from "@clerk/nextjs/server";
import EventForm from "@/components/shared/eventForm";
import { getUserByClerkId } from "@/lib/auth";

const CreateEvent = async () => {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return <div>Please sign in to create an event</div>;
  }

  const user = await getUserByClerkId(clerkUser.id);
  
  if (!user) {
    return <div>User not found. Please contact support.</div>;
  }

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">
          Create Event
        </h3>
      </section>

      <div className="wrapper my-8">
        <EventForm type="Create" userId={user.id} />
      </div>
    </>
  );
};

export default CreateEvent;