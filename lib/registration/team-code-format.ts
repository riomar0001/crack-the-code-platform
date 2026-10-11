/**
 * The shape of a team code, kept free of `node:crypto` so the format can be
 * shared by the generator, the validator and the join form.
 */

/** Crockford-style alphabet: no I, L, O, U, 0 or 1 to keep codes dictatable. */
export const TEAM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

export const TEAM_CODE_PREFIX = "CTC";
export const TEAM_CODE_GROUP_LENGTH = 4;
export const TEAM_CODE_GROUPS = 2;

const BODY_LENGTH = TEAM_CODE_GROUP_LENGTH * TEAM_CODE_GROUPS;

/** `CTC-7K2M-QW9X` */
export const TEAM_CODE_PATTERN = new RegExp(
  `^${TEAM_CODE_PREFIX}(-[${TEAM_CODE_ALPHABET}]{${TEAM_CODE_GROUP_LENGTH}}){${TEAM_CODE_GROUPS}}$`,
);

/**
 * Forgives how people actually type a code: any case, spaces or no dashes,
 * with or without the `CTC` prefix. Anything that still does not fit the
 * length is returned cleaned but unformatted, for the pattern check to reject.
 */
export function normalizeTeamCode(input: string): string {
  const compact = input.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const body =
    compact.length === BODY_LENGTH
      ? compact
      : compact.startsWith(TEAM_CODE_PREFIX) &&
          compact.length === TEAM_CODE_PREFIX.length + BODY_LENGTH
        ? compact.slice(TEAM_CODE_PREFIX.length)
        : null;

  if (body === null) return compact;

  const groups = Array.from({ length: TEAM_CODE_GROUPS }, (_, index) =>
    body.slice(index * TEAM_CODE_GROUP_LENGTH, (index + 1) * TEAM_CODE_GROUP_LENGTH),
  );

  return [TEAM_CODE_PREFIX, ...groups].join("-");
}
