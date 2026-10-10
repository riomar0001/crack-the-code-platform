import { terminalLines } from "@/lib/content/decor";
import { cssVars } from "@/lib/css";

/**
 * The hero's tablet mock-up. Each terminal line types itself out via a
 * `steps()` width animation, staggered down the list.
 */
export function OperatorTablet() {
  return (
    <div className="ctc-tablet">
      <div className="ctc-tablet-bar">
        <div className="ctc-tablet-label">OPERATOR TABLET</div>
        <div className="ctc-tablet-dots" aria-hidden>
          <i style={{ background: "var(--ctc-pink)" }} />
          <i style={{ background: "var(--ctc-yellow)" }} />
          <i style={{ background: "var(--ctc-sky)" }} />
        </div>
      </div>

      <div className="ctc-terminal">
        {terminalLines.map((line, index) => (
          <div
            key={line.text}
            className="ctc-terminal-line"
            style={cssVars({
              "--line-color": line.color,
              "--line-width": `${line.text.length + 2}ch`,
              "--line-steps": line.text.length,
              "--line-delay": `${index * 0.95}s`,
            })}
          >
            {line.text}
          </div>
        ))}
        <span className="ctc-terminal-caret" aria-hidden />
      </div>
    </div>
  );
}
