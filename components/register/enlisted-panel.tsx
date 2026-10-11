import Link from "next/link";

/** Confirmation shown once a squad is saved, with its shareable team code. */
export function EnlistedPanel({
  teamName,
  teamCode,
  onRegisterAnother,
}: {
  teamName: string;
  teamCode: string;
  onRegisterAnother: () => void;
}) {
  return (
    <div className="ctc-done ctc-notch-28">
      <div className="ctc-stripe-layer" aria-hidden />

      <div className="ctc-done-eyebrow">ENLISTMENT COMPLETE</div>
      <div className="ctc-done-title">Welcome aboard, {teamName}</div>

      <div className="ctc-done-code-block">
        <div className="ctc-done-code-label">TEAM CODE</div>
        <div className="ctc-done-code">{teamCode}</div>
      </div>

      <p>
        Save this code and share it with your squad. Teammates open Team Registration, choose
        Join a team and enter it to add themselves.
      </p>

      <div className="ctc-done-actions">
        <Link href="/" className="ctc-btn ctc-btn--primary ctc-btn--md ctc-slant-12">
          BACK TO HOME
        </Link>
        <button
          type="button"
          className="ctc-btn ctc-btn--ghost ctc-btn--md ctc-slant-12"
          onClick={onRegisterAnother}
        >
          REGISTER ANOTHER
        </button>
      </div>
    </div>
  );
}
