import { randomInt } from "node:crypto";

import {
  TEAM_CODE_ALPHABET as ALPHABET,
  TEAM_CODE_GROUP_LENGTH as GROUP_LENGTH,
  TEAM_CODE_GROUPS as GROUPS,
  TEAM_CODE_PREFIX,
} from "./team-code-format";

/**
 * Builds a shareable team code, e.g. `CTC-7K2M-QW9X`.
 *
 * Uses `crypto.randomInt` rather than `Math.random` so codes are not
 * predictable from one another.
 */
export function generateTeamCode(): string {
  const groups = Array.from({ length: GROUPS }, () =>
    Array.from({ length: GROUP_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join(""),
  );

  return [TEAM_CODE_PREFIX, ...groups].join("-");
}

/**
 * Two-character crest for the squad card.
 *
 * Multi-word names use the first letter of each word ("Kivotos Root" → "KR");
 * a single word uses its first two characters ("0xSchale" → "0X").
 */
export function teamInitials(teamName: string): string {
  const words = teamName
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const initials =
    words.length === 1 ? words[0].slice(0, 2) : words.map((word) => word[0]).join("").slice(0, 2);

  return initials.toUpperCase() || teamName.trim()[0]?.toUpperCase() || "?";
}
