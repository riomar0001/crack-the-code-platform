/**
 * Site-wide configuration. Anything an organiser might realistically want to
 * change between seasons lives here rather than inside a component.
 */

export const site = {
  name: "Crack The Code CTF",
  suffix: "Extended 2026",
  fullName: "Crack The Code CTF Extended 2026",
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

  /**
   * When the event ends, same format. Search engines want an end date for
   * events. Override per-deployment with NEXT_PUBLIC_EVENT_END.
   */
  eventEnd: process.env.NEXT_PUBLIC_EVENT_END ?? "2026-10-30T17:00:00+08:00",

  /**
   * The moment registration closes, ISO 8601 with offset. The default is the end
   * of October 29, the day before the event. Override per-deployment with
   * NEXT_PUBLIC_REGISTRATION_CLOSES. A value that does not parse as a date is
   * ignored and registration stays open, rather than closing by mistake.
   */
  registrationCloses:
    process.env.NEXT_PUBLIC_REGISTRATION_CLOSES ?? "2026-10-29T23:59:59+08:00",

  /** Email domain every participant must register under. */
  emailDomain: "umindanao.edu.ph",
  emailPlaceholder: "you@umindanao.edu.ph",

  /** Team size bounds, enforced in the UI and again in the server action. */
  minMembers: 1,
  maxMembers: 4,
  minTeamNameLength: 3,
  maxTeamNameLength: 32,
} as const;

/**
 * Human-readable event date, derived from `eventStart` so the two cannot
 * drift apart. Pinned to the venue's timezone so server and client agree.
 */
const eventDate = new Date(site.eventStart);

export const eventDateLabel = Number.isNaN(eventDate.getTime())
  ? ""
  : new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeZone: "Asia/Manila",
    }).format(eventDate);

export type Credit = {
  name: string;
  /** Path under /public. Omit for a text-only credit. */
  logo?: string;
  /** The organization's own website, for search-engine structured data. */
  url?: string;
};

export type CreditGroup = {
  label: string;
  entries: readonly Credit[];
};

/**
 * Who stands behind the event, grouped by how they take part. Order matters:
 * the first group is the organizers (also used by the footer).
 */
export const credits: readonly CreditGroup[] = [
  {
    label: "BY",
    entries: [
      {
        name: "University of Mindanao College of Computing Education",
        logo: "/credits/um-cce.webp",
        url: "https://umindanao.edu.ph",
      },
      { name: "UM CCE Olympus Protocol" },
    ],
  },
  {
    label: "IN PARTNERSHIP WITH",
    entries: [{ name: "DEVCON Davao", logo: "/credits/devcon-davao.webp" }],
  },
  {
    label: "WITH THE SUPPORT OF",
    entries: [
      { name: "University of Mindanao CCE-CSG", logo: "/credits/um-cce-csg.webp" },
      {
        name: "University of Mindanao CCE Skills Clinic",
        logo: "/credits/um-cce-skills-clinic.webp",
      },
    ],
  },
];

export const organizers = credits[0].entries.map((entry) => entry.name);

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
