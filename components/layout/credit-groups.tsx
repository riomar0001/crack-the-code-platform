import Image from "next/image";

import { credits } from "@/lib/site";

type CreditGroupsProps = {
  /** `light` sits on the sky background, `dark` on the navy footer. */
  tone: "light" | "dark";
  className?: string;
};

/** Organizers, partners and supporters, each with its logo when it has one. */
export function CreditGroups({ tone, className }: CreditGroupsProps) {
  return (
    <div className={`ctc-credits ctc-credits--${tone}${className ? ` ${className}` : ""}`}>
      {credits.map((group) => (
        <div key={group.label} className="ctc-credit-group">
          <div className="ctc-credit-label">{group.label}</div>

          <div className="ctc-credit-row">
            {group.entries.map((entry) => (
              <div key={entry.name} className="ctc-credit">
                {entry.logo && (
                  <span className="ctc-credit-logo">
                    {/* Decorative: the name sits right beside it. Served as-is:
                        the files are already small, and the optimizer caches by
                        URL, so a replaced logo would keep showing the old one. */}
                    <Image src={entry.logo} alt="" width={44} height={44} unoptimized />
                  </span>
                )}
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
