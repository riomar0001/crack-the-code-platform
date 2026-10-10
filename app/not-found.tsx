import Link from "next/link";

import { SkyLayer } from "@/components/decor/sky-layer";

export default function NotFound() {
  return (
    <section className="ctc-sky-section">
      <SkyLayer />

      <div className="ctc-notfound">
        <div className="ctc-eyebrow">404 · SIGNAL LOST</div>
        <h1>No such route</h1>
        <p>
          That page is not part of this operation. Head back to base, or go straight to squad
          enlistment.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link href="/" className="ctc-btn ctc-btn--primary ctc-btn--md ctc-slant-12">
            BACK TO HOME
          </Link>
          <Link href="/register" className="ctc-btn ctc-btn--ghost ctc-btn--md ctc-slant-12">
            REGISTER TEAM
          </Link>
        </div>
      </div>
    </section>
  );
}
