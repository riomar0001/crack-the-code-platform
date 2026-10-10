import { site } from "@/lib/site";

/**
 * Blue "mission ready" curtain that wipes away on first paint.
 *
 * Deliberately has no JavaScript: the spin and the wipe are CSS animations, so
 * the curtain is present in the server-rendered HTML and never flashes in
 * after hydration. Once the wipe finishes the element is clipped to nothing and
 * is `pointer-events: none`, so leaving it in the DOM costs nothing.
 *
 * Readers who prefer reduced motion never see it — see `styles/reveal.css`.
 */
export function IntroCurtain() {
  return (
    <div className="ctc-intro" aria-hidden>
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
