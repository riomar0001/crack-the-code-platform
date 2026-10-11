"use client";

import { useId, useState, type ReactNode } from "react";

import { RulesModal } from "@/components/register/rules-modal";

type AgreeToRulesProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The Rules and Code of Conduct to show in the modal. */
  rules: ReactNode;
  /** Wording of the agreement, shown beside the checkbox. */
  children: ReactNode;
};

/**
 * The "I agree" checkbox, with a catch: it cannot be ticked until the Rules
 * and Code of Conduct have been read to the end in the modal. Reading is the
 * only thing that sets it, so the form still posts `agree=on` as before.
 */
export function AgreeToRules({ checked, onChange, rules, children }: AgreeToRulesProps) {
  const [open, setOpen] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const id = useId();

  return (
    <>
      <div className="ctc-agree-block">
        <div className="ctc-agree">
          <input
            id={id}
            type="checkbox"
            name="agree"
            checked={checked}
            required
            onChange={(event) => {
              if (!event.target.checked) onChange(false);
              else if (hasRead) onChange(true);
              // Not read yet: open the modal instead of ticking.
              else setOpen(true);
            }}
          />
          <label htmlFor={id}>{children}</label>
        </div>

        <button type="button" className="ctc-read-link" onClick={() => setOpen(true)}>
          {hasRead ? "READ AGAIN" : "READ THE RULES & CODE OF CONDUCT"} ▸
        </button>
      </div>

      <RulesModal
        open={open}
        onClose={() => setOpen(false)}
        onAccept={() => {
          setHasRead(true);
          onChange(true);
          setOpen(false);
        }}
      >
        {rules}
      </RulesModal>
    </>
  );
}
