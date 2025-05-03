import Image from "next/image";

// components/shared/testimonials.tsx
export default function Testimonials() {
    const testimonials = [
      {
        id: 1,
        name: "Sarah Johnson",
        role: "Event Organizer",
        content: "This platform has transformed how we manage our events. Ticket sales are up 40% since we started using it!",
        avatar: "/assets/images/avatar1.jpg"
      },
      {
        id: 2,
        name: "Michael Chen",
        role: "Attendee",
        content: "I've attended 5 events through this platform and each experience has been seamless. Highly recommended!",
        avatar: "/assets/images/avatar2.jpg"
      },
      {
        id: 3,
        name: "Emma Rodriguez",
        role: "Speaker",
        content: "As a frequent speaker, I appreciate how easy it is to connect with event organizers through this platform.",
        avatar: "/assets/images/avatar3.jpg"
      }
    ];
  
    return (
      <section className="bg-gray-50 py-12">
        <div className="wrapper">
          <h2 className="h2-bold mb-8 text-center">What People Are Saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <Image
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div className="ml-4">
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }