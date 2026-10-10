import { randomInt } from "node:crypto";

/** Crockford-style alphabet: no I, L, O, U, 0 or 1 to keep codes dictatable. */
const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

const GROUP_LENGTH = 4;
const GROUPS = 2;

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

  return ["CTC", ...groups].join("-");
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
