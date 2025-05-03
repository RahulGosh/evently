"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

export const AnimatedHero = () => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.div
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-pink-50/30"
      />
      <motion.div
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 0.4, y: 0 },
        }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute inset-0 bg-[url('/assets/images/pattern.svg')] bg-cover bg-center mix-blend-overlay"
      />
      <motion.div
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 0.2, scale: 1 },
        }}
        transition={{ duration: 2, delay: 0.6 }}
        className="absolute inset-0 bg-[url('/assets/images/dots.svg')] bg-cover bg-center"
      />
    </div>
  );
};