"use client";

import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/utils';

interface CountdownProps {
  targetDate: Date;
  eventTitle: string;
}

const CountdownTimer = ({ targetDate, eventTitle }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(timer);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="bg-primary-50 p-6 rounded-xl shadow-sm">
      <h3 className="h3-bold mb-4">Next Upcoming Event</h3>
      <p className="text-lg font-medium mb-4">{eventTitle}</p>
      
      <div className="flex items-center gap-4">
        <div className="text-center bg-white p-3 rounded-lg shadow-sm">
          <span className="text-3xl font-bold block">{timeLeft.days}</span>
          <span className="text-sm">Days</span>
        </div>
        <div className="text-center bg-white p-3 rounded-lg shadow-sm">
          <span className="text-3xl font-bold block">{timeLeft.hours}</span>
          <span className="text-sm">Hours</span>
        </div>
        <div className="text-center bg-white p-3 rounded-lg shadow-sm">
          <span className="text-3xl font-bold block">{timeLeft.minutes}</span>
          <span className="text-sm">Minutes</span>
        </div>
        <div className="text-center bg-white p-3 rounded-lg shadow-sm">
          <span className="text-3xl font-bold block">{timeLeft.seconds}</span>
          <span className="text-sm">Seconds</span>
        </div>
      </div>
      
      <p className="mt-4 text-sm text-gray-600">
        Starts on: {formatDateTime(targetDate).dateTime}
      </p>
    </div>
  );
};

export default CountdownTimer;