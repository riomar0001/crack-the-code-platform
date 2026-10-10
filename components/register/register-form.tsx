"use client";

import { useActionState, useState } from "react";

import { EnlistedPanel } from "@/components/register/enlisted-panel";
import { MemberFields } from "@/components/register/member-fields";
import { SquadCard } from "@/components/register/squad-card";
import { Reveal } from "@/components/ui/reveal";
import { registerTeam } from "@/app/register/actions";
import {
  emptyMember,
  initialRegistrationState,
  type FieldErrors,
  type MemberValues,
} from "@/lib/registration/types";
import { site } from "@/lib/site";

const NO_ERRORS: FieldErrors = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerTeam, initialRegistrationState);

  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<MemberValues[]>([emptyMember()]);
  const [agree, setAgree] = useState(false);

  /**
   * `useActionState` has no reset, so "REGISTER ANOTHER" sets this flag to
   * step past the success state. Submitting again clears it.
   */
  const [restarted, setRestarted] = useState(false);

  const succeeded = state.status === "success" && !restarted;
  const fieldErrors = state.status === "error" ? state.fieldErrors : NO_ERRORS;
  const formError = state.status === "error" ? state.formError : undefined;

  const updateMember = (index: number, field: keyof MemberValues, value: string) => {
    setMembers((current) =>
      current.map((member, i) => (i === index ? { ...member, [field]: value } : member)),
    );
  };

  const addMember = () => setMembers((current) => [...current, emptyMember()]);

  const removeMember = (index: number) =>
    setMembers((current) => current.filter((_, i) => i !== index));

  const restart = () => {
    setTeamName("");
    setMembers([emptyMember()]);
    setAgree(false);
    setRestarted(true);
  };

  return (
    <div className="ctc-register-grid">
      {succeeded ? (
        <EnlistedPanel
          teamName={state.teamName}
          teamCode={state.teamCode}
          onRegisterAnother={restart}
        />
      ) : (
        <Reveal
          as="form"
          delay={120}
          className="ctc-form-card ctc-notch-28"
          action={formAction}
          onSubmit={() => setRestarted(false)}
          noValidate={false}
        >
          {/* Tells the action how many member rows to read back. */}
          <input type="hidden" name="memberCount" value={members.length} />

          <div className="ctc-field">
            <label className="ctc-label" htmlFor="teamName">
              TEAM NAME
            </label>
            <input
              id="teamName"
              name="teamName"
              className="ctc-input"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="e.g. 0xSchale"
              minLength={site.minTeamNameLength}
              maxLength={site.maxTeamNameLength}
              aria-invalid={fieldErrors.teamName ? true : undefined}
              aria-describedby={fieldErrors.teamName ? "teamName-error" : undefined}
              autoComplete="off"
              required
            />
            {fieldErrors.teamName && (
              <span id="teamName-error" className="ctc-error">
                {fieldErrors.teamName}
              </span>
            )}
          </div>

          <div className="ctc-members">
            <div className="ctc-members-head">
              <span className="ctc-label">
                MEMBERS · {members.length}/{site.maxMembers}
              </span>
              {members.length < site.maxMembers && (
                <button type="button" className="ctc-btn-quiet ctc-slant-8" onClick={addMember}>
                  + ADD MEMBER
                </button>
              )}
            </div>

            {members.map((member, index) => (
              <MemberFields
                key={index}
                index={index}
                value={member}
                fieldErrors={fieldErrors}
                onChange={(field, value) => updateMember(index, field, value)}
                onRemove={() => removeMember(index)}
              />
            ))}
          </div>

          <label className="ctc-agree">
            <input
              type="checkbox"
              name="agree"
              checked={agree}
              onChange={(event) => setAgree(event.target.checked)}
            />
            <span>
              Our squad agrees to the competition rules and code of conduct. No attacks on the
              platform infrastructure.
            </span>
          </label>

          <div className="ctc-submit-row">
            <button
              type="submit"
              className="ctc-btn ctc-btn--primary ctc-btn--lg ctc-slant-14"
              disabled={isPending}
            >
              {isPending ? "ENLISTING…" : "ENLIST SQUAD ▶"}
            </button>
            <div className="ctc-form-error" role="status" aria-live="polite">
              {formError}
            </div>
          </div>
        </Reveal>
      )}

      <SquadCard
        teamName={succeeded ? state.teamName : teamName}
        roster={succeeded ? state.roster : members.map((member) => member.alias)}
        status={succeeded ? "ENLISTED" : "DRAFT"}
      />
    </div>
  );
}
