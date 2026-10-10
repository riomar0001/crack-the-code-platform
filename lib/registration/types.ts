/**
 * Shapes shared by the registration server action and the client form.
 */

/** `members.0.email` → message, plus `teamName` / `agree` / `form`. */
export type FieldErrors = Record<string, string>;

export type RegistrationState =
  | { status: "idle" }
  | {
      status: "error";
      /** Message shown next to the submit button. */
      formError?: string;
      fieldErrors: FieldErrors;
      /** Echoed back so the form can repopulate after a failed submit. */
      values: RegistrationValues;
    }
  | {
      status: "success";
      teamName: string;
      teamCode: string;
      /** Aliases in roster order, captain first. */
      roster: string[];
    };

export type MemberValues = {
  alias: string;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
};

export type RegistrationValues = {
  teamName: string;
  members: MemberValues[];
  agree: boolean;
};

export const emptyMember = (): MemberValues => ({
  alias: "",
  firstName: "",
  lastName: "",
  studentId: "",
  email: "",
});

export const initialRegistrationState: RegistrationState = { status: "idle" };

/** Field key for a given member index, matching the `name` attributes. */
export const memberFieldName = (index: number, field: keyof MemberValues) =>
  `members.${index}.${field}`;
