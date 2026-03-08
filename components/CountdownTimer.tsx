import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

const FlipUnitContainer: React.FC<{ digit: number; unit: string }> = ({ digit, unit }) => {
  const formattedDigit = digit < 10 ? `0${digit}` : digit.toString();
  
  return (
    <div className="flex flex-col items-center mx-2 md:mx-4">
      <div className="relative w-16 h-20 md:w-24 md:h-28 bg-[#151515] rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 flex items-center justify-center">
        {/* Top half */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#222] to-[#111] border-b border-black/50 overflow-hidden">
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-4xl md:text-6xl font-mono font-bold text-white/90">
            {formattedDigit}
          </span>
        </div>
        {/* Bottom half */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#111] to-[#0a0a0a] overflow-hidden">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl md:text-6xl font-mono font-bold text-white/90">
            {formattedDigit}
          </span>
        </div>
        {/* Center line */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-black/80 -translate-y-1/2 z-10 shadow-[0_1px_2px_rgba(255,255,255,0.1)]"></div>
      </div>
      <span className="mt-4 text-[10px] md:text-xs text-white/40 uppercase tracking-[0.3em] font-medium">{unit}</span>
    </div>
  );
};

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) return null;

  return (
    <div className="flex justify-center items-center py-12">
      <FlipUnitContainer digit={timeLeft.days} unit="Days" />
      <div className="text-white/20 text-4xl font-light pb-8">:</div>
      <FlipUnitContainer digit={timeLeft.hours} unit="Hours" />
      <div className="text-white/20 text-4xl font-light pb-8">:</div>
      <FlipUnitContainer digit={timeLeft.minutes} unit="Mins" />
      <div className="text-white/20 text-4xl font-light pb-8">:</div>
      <FlipUnitContainer digit={timeLeft.seconds} unit="Secs" />
    </div>
  );
};
