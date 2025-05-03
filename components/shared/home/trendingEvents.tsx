"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Category, User } from "@prisma/client";
import Card from "../card";

type EventWithRelations = Event & {
    category: Category;
    organizer: User;
  };
  

interface TrendingEventsProps {
  events?: EventWithRelations[];
}

export const TrendingEvents = ({ events }: TrendingEventsProps) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

  // Mock data - in a real app you would fetch trending events
  const trendingEvents = [
    {
      id: "1",
      title: "Tech Conference 2023",
      description: "Annual technology conference with industry leaders",
      location: "San Francisco, CA",
      imageUrl: "/assets/images/tech-conf.jpg",
      startDateTime: new Date("2023-11-15"),
      endDateTime: new Date("2023-11-17"),
      price: "299",
      isFree: false,
      category: { id: "1", name: "Technology" },
      organizer: { id: "1", name: "Tech Events Inc" },
    },
    // Add more mock events...
  ];

  return (
    <section ref={targetRef} className="relative h-[300px] md:h-[400px] bg-gray-900 overflow-hidden">
      <div className="absolute inset-0 z-10 flex flex-col justify-center wrapper">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Trending <span className="text-primary">Events</span>
        </h2>
      </div>

      <motion.div
        style={{ x }}
        className="absolute inset-y-0 left-0 flex gap-8 items-center pl-8 pr-[50vw]"
      >
        {trendingEvents.map((event, index) => (
          <div key={index} className="w-[300px] md:w-[400px] flex-shrink-0">
            <Card event={event} hidePrice={false} />
          </div>
        ))}
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/70 to-transparent z-0" />
      <div className="absolute inset-0 bg-gradient-to-l from-gray-900 via-gray-900/70 to-transparent z-0 right-0" />
    </section>
  );
};