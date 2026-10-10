import Link from "next/link";

import { Halo } from "@/components/ui/halo";
import { site } from "@/lib/site";

/** The CTC wordmark with its spinning halo, linking home. */
export function BrandMark() {
  return (
    <Link href="/" className="ctc-brand" aria-label={`${site.fullName} home`}>
      <span className="ctc-brand-mark">
        <Halo size={40} speed={12} strokeWidth={3} tickColor="var(--ctc-blue)" />
        <span>{site.shortMark}</span>
      </span>

      <span className="ctc-brand-text">
        <span className="ctc-brand-name">{site.name.toUpperCase()}</span>
        <span className="ctc-brand-sub">{site.suffix.toUpperCase()}</span>
      </span>
    </Link>
  );
}
