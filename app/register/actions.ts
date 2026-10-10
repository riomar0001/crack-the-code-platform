"use server";

import { describeError } from "@/lib/errors";
import { saveRegistration } from "@/lib/registration/repository";
import { registrationSchema } from "@/lib/registration/schema";
import {
  type FieldErrors,
  type RegistrationState,
  type RegistrationValues,
} from "@/lib/registration/types";
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
