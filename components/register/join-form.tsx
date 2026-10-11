"use client";

import { useActionState, useState, type ReactNode } from "react";

import { joinTeam } from "@/app/register/actions";
import { AgreeToRules } from "@/components/register/agree-to-rules";
import { JoinedPanel } from "@/components/register/joined-panel";
import { MemberFields } from "@/components/register/member-fields";
import { SquadCard } from "@/components/register/squad-card";
import { Reveal } from "@/components/ui/reveal";
import {
  emptyMember,
  initialJoinState,
  type FieldErrors,
  type MemberValues,
} from "@/lib/registration/types";
import { site } from "@/lib/site";

const NO_ERRORS: FieldErrors = {};

/** Teammates add themselves to a squad the captain already registered. */
export function JoinForm({ rules }: { rules: ReactNode }) {
  const [state, formAction, isPending] = useActionState(joinTeam, initialJoinState);

  const [teamCode, setTeamCode] = useState("");
  const [member, setMember] = useState<MemberValues>(emptyMember());
  const [agree, setAgree] = useState(false);

  const fieldErrors = state.status === "error" ? state.fieldErrors : NO_ERRORS;
  const formError = state.status === "error" ? state.formError : undefined;

  if (state.status === "success") {
    return (
      <div className="ctc-register-grid">
        <JoinedPanel teamName={state.teamName} alias={state.alias} />
        <SquadCard teamName={state.teamName} roster={state.roster} status="ENLISTED" />
      </div>
    );
  }

  return (
    <div className="ctc-register-grid">
      <Reveal as="form" delay={120} className="ctc-form-card ctc-notch-28" action={formAction}>
        <div className="ctc-field">
          <label className="ctc-label" htmlFor="teamCode">
            TEAM CODE
          </label>
          <input
            id="teamCode"
            name="teamCode"
            className="ctc-input ctc-input--code"
            value={teamCode}
            onChange={(event) => setTeamCode(event.target.value.toUpperCase())}
            placeholder="CTC-XXXX-XXXX"
            maxLength={16}
            aria-invalid={fieldErrors.teamCode ? true : undefined}
            aria-describedby="teamCode-hint"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
          />
          {fieldErrors.teamCode ? (
            <span id="teamCode-hint" className="ctc-error">
              {fieldErrors.teamCode}
            </span>
          ) : (
            <span id="teamCode-hint" className="ctc-hint">
              Ask your captain. It is shown to them when they register the squad.
            </span>
          )}
        </div>

        <div className="ctc-members">
          <span className="ctc-label">YOUR DETAILS</span>

          <MemberFields
            index={0}
            captain={false}
            badge="+"
            value={member}
            fieldErrors={fieldErrors}
            onChange={(field, value) => setMember((current) => ({ ...current, [field]: value }))}
          />
        </div>

        <AgreeToRules checked={agree} onChange={setAgree} rules={rules}>
          I have read and agree to the competition rules and code of conduct. No attacks on
          the platform infrastructure.
        </AgreeToRules>

        <div className="ctc-submit-row">
          <button
            type="submit"
            className="ctc-btn ctc-btn--primary ctc-btn--lg ctc-slant-14"
            disabled={isPending}
          >
            {isPending ? "JOINING…" : "JOIN SQUAD ▶"}
          </button>
          <div className="ctc-form-error" role="status" aria-live="polite">
            {formError}
          </div>
        </div>
      </Reveal>

      <Reveal direction="right" delay={240} className="ctc-join-aside">
        <div className="ctc-squad-label">HOW JOINING WORKS</div>
        <ol>
          <li>Your captain registers the squad and gets a team code.</li>
          <li>You enter that code with your own details.</li>
          <li>
            You take the next free slot. A squad holds up to {site.maxMembers} members, so the
            code stops working once it is full.
          </li>
        </ol>
      </Reveal>
    </div>
  );
}
