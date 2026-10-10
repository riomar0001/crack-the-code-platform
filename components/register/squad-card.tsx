import { Halo } from "@/components/ui/halo";
import { HexBadge } from "@/components/ui/hex-badge";
import { Reveal } from "@/components/ui/reveal";
import { teamInitials } from "@/lib/registration/team-code";
import { site } from "@/lib/site";

type SquadCardProps = {
  teamName: string;
  /** Aliases in roster order, captain first. Blanks become placeholders. */
  roster: string[];
  status: "DRAFT" | "ENLISTED";
};

const slotColor = (index: number) =>
  index === 0 ? "var(--ctc-yellow)" : "var(--ctc-sky)";

/** Live preview of the squad as the captain fills in the form. */
export function SquadCard({ teamName, roster, status }: SquadCardProps) {
  const trimmedName = teamName.trim();

  const slots = Array.from({ length: site.maxMembers }, (_, index) => {
    const alias = roster[index]?.trim();
    const filled = index < roster.length;

    return {
      tag: index === 0 ? "C" : index + 1,
      label: filled ? alias || (index === 0 ? "Captain" : `Member ${index + 1}`) : "Open slot",
      filled,
      background: filled ? slotColor(index) : "var(--ctc-navy-dash)",
    };
  });

  return (
    <Reveal direction="right" delay={240} className="ctc-squad-card">
      <div className="ctc-squad-head">
        <div className="ctc-squad-label">SQUAD CARD</div>
        <div className="ctc-squad-status">{status}</div>
      </div>

      <div className="ctc-squad-crest">
        <Halo size={120} speed={18} strokeWidth={2} ringColor="var(--ctc-sky)" tickColor="var(--ctc-yellow)" />
        <div className="ctc-squad-initials">{trimmedName ? teamInitials(trimmedName) : "?"}</div>
      </div>

      <div className="ctc-squad-name">{trimmedName || "Your Team"}</div>

      <ul className="ctc-squad-roster">
        {slots.map((slot, index) => (
          <li
            key={index}
            className={slot.filled ? "ctc-squad-slot" : "ctc-squad-slot ctc-squad-slot--empty"}
          >
            <HexBadge size={30} background={slot.background}>
              {slot.tag}
            </HexBadge>
            <div className="ctc-squad-slot-name">{slot.label}</div>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
