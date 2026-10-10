"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { hasSeenIntro, introHasFinished, markIntroSeen } from "@/components/layout/intro-state";
import { site } from "@/lib/site";

/**
 * Blue "mission ready" curtain that wipes away on first paint.
 *
 * The spin and the wipe are pure CSS animations, so the curtain is present in
 * the server-rendered HTML and never flashes in after hydration. It is
 * `pointer-events: none` throughout and removed once the wipe finishes.
 *
 * It plays once per page load: a refresh brings it back, but returning to the
 * home page through client-side navigation does not. Two things guard that:
 * module state covers a fresh mount, and unmounting the curtain when its wipe
 * ends covers a page whose DOM is kept alive while hidden — re-showing such a
 * page would otherwise restart the CSS animation.
 *
 * Readers who prefer reduced motion never see it — see `styles/reveal.css`.
 */
export function IntroCurtain() {
  const [show, setShow] = useState(() => !hasSeenIntro());
  const curtain = useRef<HTMLDivElement>(null);

  // Also re-runs when a kept-alive page is shown again, before it paints.
  // Hides the element directly: re-showing it would restart the animation.
  useLayoutEffect(() => {
    if (curtain.current && introHasFinished()) curtain.current.style.display = "none";
  }, []);

  useEffect(() => {
    markIntroSeen();
  }, []);

  if (!show) return null;

  return (
    <div
      ref={curtain}
      className="ctc-intro"
      aria-hidden
      onAnimationEnd={(event) => {
        // The spinning rings bubble their own animation events; only the
        // curtain's own wipe means we are done.
        if (event.target === event.currentTarget) setShow(false);
      }}
    >
      <svg
        className="ctc-intro-art"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
      >
        <circle
          className="ctc-intro-ring ctc-intro-ring--outer"
          cx={600}
          cy={400}
          r={210}
          fill="none"
          stroke="#fff"
          strokeWidth={14}
          strokeDasharray="120 18 10 18"
        />
        <circle
          className="ctc-intro-ring ctc-intro-ring--inner"
          cx={600}
          cy={400}
          r={160}
          fill="none"
          stroke="var(--ctc-yellow)"
          strokeWidth={6}
          strokeDasharray="4 12"
        />
        <circle
          className="ctc-intro-ring ctc-intro-ring--dot"
          cx={600}
          cy={190}
          r={10}
          fill="var(--ctc-yellow)"
        />
        <text
          x={600}
          y={438}
          textAnchor="middle"
          fontFamily="var(--font-saira), sans-serif"
          fontStyle="italic"
          fontWeight={900}
          fontSize={104}
          fill="#fff"
        >
          {site.shortMark}
        </text>
        <text
          x={600}
          y={690}
          textAnchor="middle"
          fontFamily="var(--font-saira), sans-serif"
          fontWeight={700}
          fontSize={22}
          letterSpacing={8}
          fill="#fff"
        >
          MISSION READY
        </text>
      </svg>
    </div>
  );
}
