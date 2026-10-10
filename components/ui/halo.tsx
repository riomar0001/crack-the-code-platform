import { cssVars } from "@/lib/css";

/**
 * Rotating technical ring. Used behind the logo, the hero tablet, the squad
 * card crest and a couple of section backdrops.
 */

type HaloProps = {
  size: number;
  /** Seconds for one full rotation of the outer ring. */
  speed?: number;
  /** Outer ring stroke width. */
  strokeWidth?: number;
  ringColor?: string;
  tickColor?: string;
  /** Adds the counter-rotating inner rings. */
  inner?: boolean;
  className?: string;
};

const TICK_COUNT = 24;

export function Halo({
  size,
  speed = 30,
  strokeWidth = 1.4,
  ringColor = "var(--ctc-blue)",
  tickColor = "var(--ctc-sky)",
  inner = false,
  className,
}: HaloProps) {
  // Every 6th tick is longer and heavier, giving the ring a compass feel.
  const ticks = Array.from({ length: TICK_COUNT }, (_, index) => {
    const major = index % 6 === 0;

    return (
      <line
        key={index}
        x1={50}
        y1={3}
        x2={50}
        y2={major ? 11 : 7}
        stroke={tickColor}
        strokeWidth={major ? 2 : 1}
        transform={`rotate(${index * 15} 50 50)`}
      />
    );
  });

  return (
    <div
      aria-hidden
      className={className ? `ctc-halo ${className}` : "ctc-halo"}
      style={cssVars({ "--halo-size": `${size}px`, "--halo-speed": `${speed}s` })}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="ctc-halo-outer">
        <circle
          cx={50}
          cy={50}
          r={46}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray="60 8 4 8"
        />
        {ticks}
      </svg>

      {inner && (
        <svg viewBox="0 0 100 100" width={size} height={size} className="ctc-halo-inner">
          <circle
            cx={50}
            cy={50}
            r={36}
            fill="none"
            stroke="var(--ctc-yellow)"
            strokeWidth={1.2}
            strokeDasharray="2 5"
          />
          <circle cx={50} cy={50} r={30} fill="none" stroke="#fff" strokeWidth={3} opacity={0.7} />
        </svg>
      )}
    </div>
  );
}
