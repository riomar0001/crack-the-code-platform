import Link from "next/link";

/** Confirmation shown once a teammate has joined a squad by its code. */
export function JoinedPanel({ teamName, alias }: { teamName: string; alias: string }) {
  return (
    <div className="ctc-done ctc-notch-28">
      <div className="ctc-stripe-layer" aria-hidden />

      <div className="ctc-done-eyebrow">SQUAD JOINED</div>
      <div className="ctc-done-title">Welcome aboard, {alias}</div>

      <p>
        You are on the roster for <b>{teamName}</b>. Your slot is on the squad card.
      </p>

      <div className="ctc-done-actions">
        <Link href="/" className="ctc-btn ctc-btn--primary ctc-btn--md ctc-slant-12">
          BACK TO HOME
        </Link>
      </div>
    </div>
  );
}
