"use client";

import { HexBadge } from "@/components/ui/hex-badge";
import { Reveal } from "@/components/ui/reveal";
import { memberFieldName, type FieldErrors, type MemberValues } from "@/lib/registration/types";
import { site } from "@/lib/site";

type MemberFieldsProps = {
  index: number;
  value: MemberValues;
  fieldErrors: FieldErrors;
  onChange: (field: keyof MemberValues, value: string) => void;
  /** Omit for a row that cannot be removed (e.g. someone joining a squad). */
  onRemove?: () => void;
  /** Row 0 is the captain unless told otherwise. */
  captain?: boolean;
  /** Badge for a non-captain row; defaults to the row number. */
  badge?: string;
};

const FIELDS = [
  { key: "alias", label: "Alias", placeholder: "Alias", className: "ctc-member-alias" },
  {
    key: "firstName",
    label: "First name",
    placeholder: "First name",
    className: "ctc-member-first",
  },
  { key: "lastName", label: "Last name", placeholder: "Last name", className: "ctc-member-last" },
  {
    key: "studentId",
    label: "Student ID number",
    placeholder: "Student ID no.",
    className: "ctc-member-student-id",
  },
] as const;

/** One row of the member list: alias, first name, last name, email. */
export function MemberFields({
  index,
  value,
  fieldErrors,
  onChange,
  onRemove,
  captain,
  badge,
}: MemberFieldsProps) {
  const isCaptain = captain ?? index === 0;
  const errorFor = (field: keyof MemberValues) => fieldErrors[memberFieldName(index, field)];

  const errors = (["alias", "firstName", "lastName", "studentId", "email"] as const)
    .map((field) => errorFor(field))
    .filter((message): message is string => Boolean(message));

  const who = isCaptain ? "captain" : onRemove ? `member ${index + 1}` : "you";

  return (
    <Reveal
      direction="left"
      className={isCaptain || !onRemove ? "ctc-member" : "ctc-member ctc-member--removable"}
    >
      <HexBadge size={36} background={isCaptain ? "var(--ctc-yellow)" : "var(--ctc-chip)"}>
        {isCaptain ? "C" : (badge ?? index + 1)}
      </HexBadge>

      <div className="ctc-member-inputs">
        {FIELDS.map((field) => (
          <input
            key={field.key}
            className={`ctc-input ctc-input--compact ${field.className}`}
            type="text"
            name={memberFieldName(index, field.key)}
            value={value[field.key]}
            onChange={(event) => onChange(field.key, event.target.value)}
            placeholder={field.placeholder}
            aria-label={`${field.label} — ${who}`}
            aria-invalid={errorFor(field.key) ? true : undefined}
            autoComplete="off"
            required
          />
        ))}

        <input
          className="ctc-input ctc-input--compact ctc-member-email"
          type="email"
          name={memberFieldName(index, "email")}
          value={value.email}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder={site.emailPlaceholder}
          aria-label={`Email — ${who}`}
          aria-invalid={errorFor("email") ? true : undefined}
          autoComplete="off"
          required
        />
      </div>

      {!isCaptain && onRemove && (
        <button
          type="button"
          className="ctc-member-remove"
          onClick={onRemove}
          aria-label={`Remove member ${index + 1}`}
        >
          ×
        </button>
      )}

      {errors.length > 0 && (
        <div className="ctc-member-errors">
          {errors.map((message) => (
            <span key={message} className="ctc-error">
              {message}
            </span>
          ))}
        </div>
      )}
    </Reveal>
  );
}
