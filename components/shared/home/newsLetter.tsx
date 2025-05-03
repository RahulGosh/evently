"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would call an API here
    console.log("Subscribed with:", email);
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <section ref={ref} className="bg-primary py-20">
      <div className="wrapper">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0, y: 50 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-xl p-8 md:p-12 shadow-lg max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stay in the <span className="text-primary">Loop</span>
            </h2>
            <p className="text-xl text-gray-600">
              Subscribe to our newsletter for the latest events and updates.
            </p>
          </div>

          {subscribed ? (
            <div className="text-center py-8">
              <h3 className="text-2xl font-semibold text-primary mb-2">Thank you for subscribing!</h3>
              <p className="text-gray-600">You'll receive our next newsletter soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <Input
                type="email"
                placeholder="Your email address"
                className="flex-grow py-6 px-4 text-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" size="lg" className="py-6 px-8 text-lg">
                Subscribe
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};