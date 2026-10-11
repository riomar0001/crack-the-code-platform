"use client";

import { useEffect, useState } from "react";

type CountdownProps = {
  /** ISO 8601 target with an offset, e.g. `2026-10-30T09:00:00+08:00`. */
  target: string;
};

const UNITS = ["DAYS", "HRS", "MIN", "SEC"] as const;

const MS = { day: 86_400_000, hour: 3_600_000, minute: 60_000, second: 1_000 };

function split(remaining: number) {
  return [
    Math.floor(remaining / MS.day),
    Math.floor(remaining / MS.hour) % 24,
    Math.floor(remaining / MS.minute) % 60,
    Math.floor(remaining / MS.second) % 60,
  ];
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Ticking countdown to kick-off.
 *
 * Renders zeros on the server and starts from the real clock after mount, so
 * the markup is deterministic and never triggers a hydration mismatch.
 */
export function Countdown({ target }: CountdownProps) {
  const targetMs = new Date(target).getTime();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (Number.isNaN(targetMs)) return;

    const tick = () => setRemaining(Math.max(0, targetMs - Date.now()));

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [targetMs]);

  // Once the operation has begun there is nothing left to count down to.
  if (remaining === 0) return null;

  const parts = split(remaining ?? 0);

  return (
    <div className="ctc-countdown-block">
      <div className="ctc-countdown-label">OPERATION BEGINS IN</div>

      <ul className="ctc-countdown">
        {parts.map((value, index) => (
          <li key={UNITS[index]} className="ctc-countdown-cell ctc-notch-12">
            {/* Re-keying on the value restarts the flip animation each tick. */}
            <div
              key={value}
              className={
                remaining === null
                  ? "ctc-countdown-value"
                  : "ctc-countdown-value ctc-countdown-value--tick"
              }
            >
              {pad(value)}
            </div>
            <div className="ctc-countdown-unit">{UNITS[index]}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
