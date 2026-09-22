import React, { useEffect, useState, useRef } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { sounds } from "../utils/audio";

interface TimerBarProps {
  duration: number; // in seconds
  isActive: boolean;
  onTimeout: () => void;
  resetKey: string | number; // changes whenever question changes
}

export const TimerBar: React.FC<TimerBarProps> = ({
  duration,
  isActive,
  onTimeout,
  resetKey,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    setTimeLeft(duration);
  }, [resetKey, duration]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeoutRef.current();
          return 0;
        }

        const next = prev - 1;
        // Sound ticks on urgency (< 6 seconds)
        if (next <= 5 && next > 0) {
          sounds.playTick(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, resetKey]);

  const percentage = Math.max(0, Math.min(100, (timeLeft / duration) * 100));
  const isUrgent = timeLeft <= 5;
  const isWarning = timeLeft <= 10 && !isUrgent;

  return (
    <div className="w-full flex flex-col gap-1 select-none">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="flex items-center gap-1 text-slate-400">
          <Clock className={`w-3.5 h-3.5 ${isUrgent ? "text-rose-400 animate-spin" : "text-slate-400"}`} />
          Tiempo restante:
        </span>
        <span
          className={`font-bold text-sm ${
            isUrgent
              ? "text-rose-400 animate-pulse"
              : isWarning
              ? "text-amber-400"
              : "text-emerald-400"
          }`}
        >
          {timeLeft}s
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            isUrgent
              ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]"
              : isWarning
              ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
              : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
