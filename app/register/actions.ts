"use server";

import { after } from "next/server";

import { sendJoinEmails, sendRegistrationEmails } from "@/lib/email/notifications";
import { describeError } from "@/lib/errors";
import { joinTeam as joinTeamRecord, saveRegistration } from "@/lib/registration/repository";
import { joinSchema, registrationSchema } from "@/lib/registration/schema";
import {
  type FieldErrors,
  type JoinState,
  type RegistrationState,
  type RegistrationValues,
} from "@/lib/registration/types";
import { isRegistrationOpen, REGISTRATION_CLOSED_MESSAGE } from "@/lib/registration/window";
import { site } from "@/lib/site";

/**
 * Reconstructs the submission from flat form fields
 * (`members.0.firstName`, …) so the form degrades without JavaScript.
 */
function readValues(formData: FormData): RegistrationValues {
  const text = (key: string) => String(formData.get(key) ?? "");

  const count = Math.min(
    Math.max(Number(formData.get("memberCount")) || site.minMembers, site.minMembers),
    site.maxMembers,
  );

  return {
    teamName: text("teamName"),
    agree: formData.get("agree") === "on",
    members: Array.from({ length: count }, (_, index) => ({
      alias: text(`members.${index}.alias`),
      firstName: text(`members.${index}.firstName`),
      lastName: text(`members.${index}.lastName`),
      studentId: text(`members.${index}.studentId`),
      email: text(`members.${index}.email`),
    })),
  };
}

/** Flattens Zod issues into the `members.0.email` keys the form looks up. */
function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of issues) {
    const key = issue.path.join(".");
    // Keep the first message per field — that's the most specific one.
    if (key && !(key in errors)) errors[key] = issue.message;
  }

  return errors;
}

export async function registerTeam(
  _previous: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const values = readValues(formData);

  // The deadline is enforced here, not in the page: a form left open in a tab
  // before the cutoff must not be able to register afterwards.
  if (!isRegistrationOpen()) {
    return { status: "error", formError: REGISTRATION_CLOSED_MESSAGE, fieldErrors: {}, values };
  }

  const parsed = registrationSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error.issues);

    return {
      status: "error",
      // `agree` has no visible field of its own, so surface it by the button.
      formError: fieldErrors.agree,
      fieldErrors,
      values,
    };
  }

  try {
    const result = await saveRegistration(parsed.data);

    if (!result.ok) {
      return {
        status: "error",
        formError: result.formError,
        fieldErrors: result.fieldErrors,
        values,
      };
    }

    // Confirmation emails go out after the response, so a slow mail server
    // never holds up the form; a failed send is logged, never surfaced.
    after(() =>
      sendRegistrationEmails({
        teamName: parsed.data.teamName,
        teamCode: result.teamCode,
        members: parsed.data.members,
      }),
    );

    return {
      status: "success",
      teamName: parsed.data.teamName,
      teamCode: result.teamCode,
      roster: parsed.data.members.map((member) => member.alias),
    };
  } catch (error) {
    console.error("[register] registration failed:", describeError(error));

    return {
      status: "error",
      formError: "Something went wrong saving your squad. Please try again in a moment.",
      fieldErrors: {},
      values,
    };
  }
}

/**
 * A teammate adding themselves to an existing squad by team code.
 *
 * The code is the only credential, so a wrong code and a full squad answer
 * with the same sort of message the form shows beside the code field.
 */
export async function joinTeam(_previous: JoinState, formData: FormData): Promise<JoinState> {
  const text = (key: string) => String(formData.get(key) ?? "");

  if (!isRegistrationOpen()) {
    return { status: "error", formError: REGISTRATION_CLOSED_MESSAGE, fieldErrors: {} };
  }

  const parsed = joinSchema.safeParse({
    teamCode: text("teamCode"),
    agree: formData.get("agree") === "on",
    members: [
      {
        alias: text("members.0.alias"),
        firstName: text("members.0.firstName"),
        lastName: text("members.0.lastName"),
        studentId: text("members.0.studentId"),
        email: text("members.0.email"),
      },
    ],
  });

  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error.issues);

    return { status: "error", formError: fieldErrors.agree, fieldErrors };
  }

  try {
    const result = await joinTeamRecord(parsed.data);

    if (!result.ok) {
      return { status: "error", formError: result.formError, fieldErrors: result.fieldErrors };
    }

    after(() =>
      sendJoinEmails({
        teamName: result.teamName,
        teamCode: parsed.data.teamCode,
        member: parsed.data.members[0],
        roster: result.roster,
      }),
    );

    return {
      status: "success",
      teamName: result.teamName,
      alias: parsed.data.members[0].alias,
      roster: result.roster,
    };
  } catch (error) {
    console.error("[register] join failed:", describeError(error));

    return {
      status: "error",
      formError: "Something went wrong joining that squad. Please try again in a moment.",
      fieldErrors: {},
    };
  }
}
