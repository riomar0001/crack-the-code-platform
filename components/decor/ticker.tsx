import { tickerItems } from "@/lib/content/decor";

/**
 * Infinite marquee. The item list is rendered twice inside a `max-content`
 * row and translated by -50%, so the loop point is seamless.
 */
export function Ticker() {
  const row = (copy: string) => (
    <>
      {tickerItems.map((item, index) => (
        <span key={`${copy}-${index}`} className="ctc-ticker-item">
          <i aria-hidden>◆</i>
          {item}
        </span>
      ))}
    </>
  );

  return (
    <div className="ctc-ticker">
      <div className="ctc-ticker-row">
        {row("a")}
        {/* Duplicate is decorative only — screen readers get the list once. */}
        <span aria-hidden style={{ display: "contents" }}>
          {row("b")}
        </span>
      </div>
    </div>
  );
}
