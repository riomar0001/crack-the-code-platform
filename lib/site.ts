/**
 * Site-wide configuration. Anything an organiser might realistically want to
 * change between seasons lives here rather than inside a component.
 */

export const site = {
  name: "Crack The Code",
  suffix: "CTF Extended",
  fullName: "Crack The Code CTF Extended",
  shortMark: "CTC",
  season: "SEASON 03",
  format: "JEOPARDY-STYLE · TEAMS OF 1–4",
  tagline:
    "Test your skills. Outsmart the challenges. Uncover vulnerabilities and compete to claim the flag. Think your squad can crack them all? Prove it.",
  byline: "Team UM CCE Olympus Protocol",
  copyrightYear: 2026,
  docsUpdated: "October 2026",
  flagFormat: "CTC{string_here}",

  /**
   * Kick-off, as an ISO 8601 string with offset. Drives the hero countdown.
   * Override per-deployment with NEXT_PUBLIC_EVENT_START.
   */
  eventStart: process.env.NEXT_PUBLIC_EVENT_START ?? "2026-10-30T09:00:00+08:00",

  organizers: [
    "University of Mindanao | College of Computing Education",
    "University of Mindanao | College of Computing Education: Skills Clinic",
  ],

  /** Email domain every participant must register under. */
  emailDomain: "umindanao.edu.ph",
  emailPlaceholder: "you@umindanao.edu.ph",

  /** Team size bounds, enforced in the UI and again in the server action. */
  minMembers: 1,
  maxMembers: 4,
  minTeamNameLength: 3,
  maxTeamNameLength: 32,
} as const;

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/#missions", label: "Missions" },
  { href: "/#faq", label: "FAQ" },
  { href: "/rules", label: "Rules" },
  { href: "/register", label: "Team Registration" },
] as const;

export const footerNav = [
  { href: "/rules", label: "Rules" },
  { href: "/conduct", label: "Code of Conduct" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
] as const;
