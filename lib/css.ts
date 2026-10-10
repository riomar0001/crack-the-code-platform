import type { CSSProperties } from "react";

/**
 * Lets components pass CSS custom properties through `style` without fighting
 * React's `CSSProperties` type, which only knows about standard properties.
 *
 *   <div style={cssVars({ "--halo-size": "560px" })} />
 */
export function cssVars(
  vars: Record<string, string | number | undefined>,
  base?: CSSProperties,
): CSSProperties {
  const defined = Object.fromEntries(
    Object.entries(vars).filter(([, value]) => value !== undefined),
  );

  return { ...base, ...defined } as CSSProperties;
}
