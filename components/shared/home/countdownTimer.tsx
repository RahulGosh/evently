// components/shared/countdownTimer.tsx
'use client';

import { useEffect, useState } from 'react';

export default function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(interval);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold">{timeLeft.days}</div>
        <div className="text-sm">Days</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{timeLeft.hours}</div>
        <div className="text-sm">Hours</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{timeLeft.minutes}</div>
        <div className="text-sm">Minutes</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{timeLeft.seconds}</div>
        <div className="text-sm">Seconds</div>
      </div>
    </div>
  );
}