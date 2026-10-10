import type { ReactNode } from "react";

import { cssVars } from "@/lib/css";

/** Hexagonal slot marker — "C" for the captain, then 2, 3, 4. */

type HexBadgeProps = {
  size: number;
  background: string;
  color?: string;
  children: ReactNode;
};

export function HexBadge({ size, background, color, children }: HexBadgeProps) {
  return (
    <span
      className="ctc-hex"
      style={cssVars({
        "--hex-size": `${size}px`,
        "--hex-bg": background,
        "--hex-fg": color,
      })}
    >
      {children}
    </span>
  );
}
