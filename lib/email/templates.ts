import { credits, eventDateLabel, site } from "@/lib/site";

/**
 * Registration and join confirmation emails.
 *
 * Email clients ignore most modern CSS, so the markup is the table-based,
 * inline-styled layout from the design template (`Registration Confirmation
 * Email.html`), parameterised. Everything that came from a user is escaped.
 */

export type RosterEntry = {
  alias: string;
  /** Second line under the alias: a real name, a role, or both. */
  detail?: string;
};

type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

/* -------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------- */

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const esc = (value: string) => value.replace(/[&<>"']/g, (char) => ESCAPES[char]);

/** Header values must stay on one line, or a name could inject new headers. */
const LINE_BREAKS = new RegExp("[\r\n\u2028\u2029]+", "g");
const oneLine = (value: string) => value.replace(LINE_BREAKS, " ").trim();

const eventDate = (() => {
  const date = new Date(site.eventStart);

  return Number.isNaN(date.getTime())
    ? eventDateLabel || "To be announced"
    : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(
        date,
      );
})();

const FONT = "font-family:Arial,Helvetica,sans-serif;";

/* -------------------------------------------------------------------------
   Layout blocks
   ------------------------------------------------------------------------- */

function rosterRows(roster: RosterEntry[]): string {
  return roster
    .map((entry, index) => {
      const captain = index === 0;
      const badgeBg = captain ? "#FFD84D" : "#6FD3FF";
      const badge = captain ? "C" : String(index + 1);

      return `
      <tr>
        <td width="44" style="width:44px;padding:12px 0;border-bottom:1px solid #D6E7FA;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="30" height="30" align="center" bgcolor="${badgeBg}" style="width:30px;height:30px;background-color:${badgeBg};border-radius:15px;${FONT}font-size:13px;font-weight:900;color:#1B2A4A;">${badge}</td></tr></table></td>
        <td style="padding:12px 0;border-bottom:1px solid #D6E7FA;font-size:15px;line-height:20px;color:#1B2A4A;"><b>${esc(entry.alias)}</b>${
          entry.detail
            ? `<br><span style="font-size:13px;color:#3D5275;">${esc(entry.detail)}</span>`
            : ""
        }</td>
      </tr>`;
    })
    .join("");
}

function organizersHtml(): string {
  return credits
    .map(
      (group, index) => `
    <div style="margin-top:${index === 0 ? 8 : 14}px;font-size:11px;line-height:14px;font-weight:700;letter-spacing:3px;color:#6FD3FF;">${esc(group.label)}</div>
    <div style="margin-top:6px;font-size:13px;line-height:20px;font-weight:700;color:#FFFFFF;">${group.entries
      .map((entry) => esc(entry.name))
      .join("<br>")}</div>`,
    )
    .join("");
}

const organizersText = () =>
  credits
    .map((group) => `${group.label}: ${group.entries.map((entry) => entry.name).join("; ")}`)
    .join("\n");

type LayoutInput = {
  preheader: string;
  title: string;
  eyebrow: string;
  /** Raw HTML, already escaped by the caller. */
  headingHtml: string;
  introHtml: string;
  codeNote: string;
  teamCode: string;
  rosterTitle: string;
  roster: RosterEntry[];
  /** Absolute link to the rules page; the button is left out without one. */
  rulesUrl: string | null;
  reason: string;
};

function layout(input: LayoutInput): string {
  const cta = input.rulesUrl
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td bgcolor="#FFD84D" style="background-color:#FFD84D;border-radius:4px;">
        <a href="${esc(input.rulesUrl)}" style="display:block;padding:15px 30px;${FONT}font-size:16px;line-height:20px;font-weight:900;font-style:italic;letter-spacing:1px;color:#1B2A4A;text-decoration:none;">READ THE RULES &#9654;</a>
      </td>
    </tr></table>`
    : "";

  const checklist = [
    ["#128AFA", "Bring a laptop for each member and your own extension cords."],
    [
      "#128AFA",
      "Preinstall free or community-edition tools (Kali Linux, Burp Suite Community, Wireshark, Python).",
    ],
    ["#128AFA", "Attend the mandatory technical briefing 15 minutes before the timer starts."],
    ["#E2607F", "No AI/LLM tools, VPNs, messaging apps or headsets during the competition."],
  ]
    .map(
      ([color, text]) =>
        `<tr><td width="22" valign="top" style="width:22px;padding:6px 0;font-size:14px;line-height:22px;color:${color};font-weight:900;">&#9670;</td><td style="padding:6px 0;font-size:15px;line-height:22px;color:#3D5275;">${text}</td></tr>`,
    )
    .join("\n      ");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(input.title)}</title>
<!--[if mso]><style>table,td{border-collapse:collapse;}</style><![endif]-->
<style>
body{margin:0;padding:0;}
a{color:#0B5FC2;}
@media (max-width:620px){
  .wrap{width:100% !important;}
  .px{padding-left:24px !important;padding-right:24px !important;}
  .h1{font-size:34px !important;line-height:38px !important;}
  .code{font-size:22px !important;letter-spacing:3px !important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#E3F0FC;">
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#E3F0FC;">${esc(input.preheader)}</span>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#E3F0FC" style="background-color:#E3F0FC;">
<tr><td align="center" style="padding:32px 12px;">

<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

  <!-- Top stripe -->
  <tr><td height="6" bgcolor="#FFD84D" style="height:6px;font-size:0;line-height:0;background-color:#FFD84D;">&nbsp;</td></tr>

  <!-- Header -->
  <tr><td class="px" bgcolor="#128AFA" style="background-color:#128AFA;padding:28px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td valign="middle" style="${FONT}">
          <div style="font-size:20px;line-height:22px;font-weight:900;font-style:italic;color:#FFFFFF;mso-line-height-rule:exactly;">${esc(site.name.toUpperCase())}</div>
          <div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:4px;color:#DDF1FF;mso-line-height-rule:exactly;">${esc(site.suffix.toUpperCase())}</div>
        </td>
        <td valign="middle" align="right">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td bgcolor="#1B2A4A" style="background-color:#1B2A4A;padding:6px 14px;${FONT}font-size:11px;line-height:14px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">${esc(site.season)}</td>
          </tr></table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Hero -->
  <tr><td class="px" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:40px 40px 8px;${FONT}">
    <div style="font-size:12px;line-height:16px;font-weight:700;letter-spacing:4px;color:#0B5FC2;mso-line-height-rule:exactly;">${esc(input.eyebrow)}</div>
    <h1 class="h1" style="margin:10px 0 0;font-size:42px;line-height:46px;font-weight:900;font-style:italic;color:#1B2A4A;mso-line-height-rule:exactly;">${input.headingHtml}</h1>
    <p style="margin:18px 0 0;font-size:16px;line-height:26px;color:#3D5275;mso-line-height-rule:exactly;">${input.introHtml}</p>
  </td></tr>

  <!-- Team code -->
  <tr><td class="px" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1B2A4A" style="background-color:#1B2A4A;">
      <tr><td style="padding:24px 28px;${FONT}">
        <div style="font-size:11px;line-height:14px;font-weight:700;letter-spacing:3px;color:#6FD3FF;">TEAM CODE</div>
        <div class="code" style="margin-top:8px;font-family:'Courier New',Courier,monospace;font-size:28px;line-height:34px;font-weight:700;letter-spacing:5px;color:#FFD84D;mso-line-height-rule:exactly;">${esc(input.teamCode)}</div>
        <div style="margin-top:10px;font-size:13px;line-height:20px;color:#CFE0F5;">${esc(input.codeNote)}</div>
      </td></tr>
    </table>
  </td></tr>

  <!-- Event details -->
  <tr><td class="px" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="50%" valign="top" style="width:50%;padding:0 8px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EAF4FF" style="background-color:#EAF4FF;border-left:4px solid #128AFA;">
            <tr><td style="padding:14px 16px;${FONT}">
              <div style="font-size:11px;line-height:14px;font-weight:700;letter-spacing:2px;color:#0B5FC2;">OPERATION DATE</div>
              <div style="margin-top:4px;font-size:18px;line-height:24px;font-weight:900;font-style:italic;color:#1B2A4A;">${esc(eventDate)}</div>
            </td></tr>
          </table>
        </td>
        <td width="50%" valign="top" style="width:50%;padding:0 0 0 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EAF4FF" style="background-color:#EAF4FF;border-left:4px solid #FFD84D;">
            <tr><td style="padding:14px 16px;${FONT}">
              <div style="font-size:11px;line-height:14px;font-weight:700;letter-spacing:2px;color:#0B5FC2;">FORMAT</div>
              <div style="margin-top:4px;font-size:18px;line-height:24px;font-weight:900;font-style:italic;color:#1B2A4A;">Jeopardy-style</div>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Roster -->
  <tr><td class="px" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:32px 40px 0;${FONT}">
    <div style="font-size:12px;line-height:16px;font-weight:700;letter-spacing:3px;color:#0B5FC2;">${esc(input.rosterTitle)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;border-top:1px solid #D6E7FA;">${rosterRows(input.roster)}
    </table>
  </td></tr>

  <!-- Checklist -->
  <tr><td class="px" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:32px 40px 0;${FONT}">
    <div style="font-size:12px;line-height:16px;font-weight:700;letter-spacing:3px;color:#0B5FC2;">MISSION PREP</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
      ${checklist}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td class="px" bgcolor="#FFFFFF" align="left" style="background-color:#FFFFFF;padding:32px 40px 40px;">${cta}
    <p style="margin:18px 0 0;${FONT}font-size:13px;line-height:20px;color:#5B6E8F;">Need to change your roster? Reply to this email before the registration deadline.</p>
  </td></tr>

  <!-- Footer -->
  <tr><td class="px" bgcolor="#1B2A4A" style="background-color:#1B2A4A;padding:28px 40px;${FONT}">${organizersHtml()}
    <div style="margin-top:16px;font-size:12px;line-height:18px;color:#9FB3D1;">${esc(input.reason)}<br>University of Mindanao, Bolton St., Davao City, Philippines</div>
    <div style="margin-top:12px;font-size:12px;line-height:18px;color:#9FB3D1;">&copy; ${site.copyrightYear} ${esc(site.fullName)} &middot; by ${esc(site.byline)}</div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
`;
}

function plainText(input: {
  heading: string;
  intro: string;
  teamCode: string;
  codeNote: string;
  rosterTitle: string;
  roster: RosterEntry[];
  rulesUrl: string | null;
  reason: string;
}): string {
  const roster = input.roster
    .map((entry, index) => {
      const slot = index === 0 ? "C" : String(index + 1);
      return `  ${slot}. ${entry.alias}${entry.detail ? ` (${entry.detail})` : ""}`;
    })
    .join("\n");

  return [
    `${site.fullName.toUpperCase()} · ${site.season}`,
    "",
    input.heading,
    "",
    input.intro,
    "",
    `TEAM CODE: ${input.teamCode}`,
    input.codeNote,
    "",
    `OPERATION DATE: ${eventDate}`,
    "FORMAT: Jeopardy-style",
    "",
    input.rosterTitle,
    roster,
    "",
    "MISSION PREP",
    "  - Bring a laptop for each member and your own extension cords.",
    "  - Preinstall free or community-edition tools (Kali Linux, Burp Suite Community, Wireshark, Python).",
    "  - Attend the mandatory technical briefing 15 minutes before the timer starts.",
    "  - No AI/LLM tools, VPNs, messaging apps or headsets during the competition.",
    "",
    input.rulesUrl ? `Read the rules: ${input.rulesUrl}` : "",
    "Need to change your roster? Reply to this email before the registration deadline.",
    "",
    "--",
    organizersText(),
    "",
    input.reason,
    "University of Mindanao, Bolton St., Davao City, Philippines",
    `© ${site.copyrightYear} ${site.fullName} · by ${site.byline}`,
    "",
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n");
}

/* -------------------------------------------------------------------------
   The two emails
   ------------------------------------------------------------------------- */

type RegistrationEmailInput = {
  teamName: string;
  teamCode: string;
  roster: RosterEntry[];
  rulesUrl: string | null;
};

/** Sent to every member when a captain enlists a squad. */
export function registrationConfirmationEmail(input: RegistrationEmailInput): EmailContent {
  const intro = `Your squad is registered for ${site.fullName}. Think your squad can crack them all? Prove it on ${eventDate}.`;
  const codeNote =
    "Save this code. Teammates who are not on the roster yet can use it to join the squad on the registration page, up to four members in all.";
  const reason = `You received this because you were listed on a squad registered for ${site.fullName}.`;

  return {
    subject: oneLine(`You're enlisted: ${input.teamName} · ${site.fullName}`),
    html: layout({
      preheader: `Your squad is registered for ${site.fullName}. Save your team code inside.`,
      title: `Squad enlisted · ${site.fullName}`,
      eyebrow: "ENLISTMENT COMPLETE",
      headingHtml: `Welcome aboard,<br>${esc(input.teamName)}`,
      introHtml: esc(intro),
      codeNote,
      teamCode: input.teamCode,
      rosterTitle: "SQUAD ROSTER",
      roster: input.roster,
      rulesUrl: input.rulesUrl,
      reason,
    }),
    text: plainText({
      heading: `Welcome aboard, ${input.teamName}`,
      intro,
      teamCode: input.teamCode,
      codeNote,
      rosterTitle: "SQUAD ROSTER",
      roster: input.roster,
      rulesUrl: input.rulesUrl,
      reason,
    }),
  };
}

type JoinEmailInput = {
  alias: string;
  teamName: string;
  /** The code they joined with, so they have it to hand for teammates. */
  teamCode: string;
  roster: RosterEntry[];
  rulesUrl: string | null;
};

/** Sent to a teammate who has just joined an existing squad by its code. */
export function joinConfirmationEmail(input: JoinEmailInput): EmailContent {
  const intro = `You are now on the roster for ${input.teamName} at ${site.fullName}. Think your squad can crack them all? Prove it on ${eventDate}.`;
  const codeNote =
    "This is your squad's team code. Share it with a teammate who has not joined yet, up to four members in all.";
  const reason = `You received this because you joined a squad for ${site.fullName}.`;

  return {
    subject: oneLine(`You joined ${input.teamName} · ${site.fullName}`),
    html: layout({
      preheader: `You joined ${input.teamName} for ${site.fullName}. Your team code is inside.`,
      title: `Squad joined · ${site.fullName}`,
      eyebrow: "SQUAD JOINED",
      headingHtml: `Welcome aboard,<br>${esc(input.alias)}`,
      introHtml: esc(intro),
      codeNote,
      teamCode: input.teamCode,
      rosterTitle: `${input.teamName.toUpperCase()} · SQUAD ROSTER`,
      roster: input.roster,
      rulesUrl: input.rulesUrl,
      reason,
    }),
    text: plainText({
      heading: `Welcome aboard, ${input.alias}`,
      intro,
      teamCode: input.teamCode,
      codeNote,
      rosterTitle: `${input.teamName.toUpperCase()} · SQUAD ROSTER`,
      roster: input.roster,
      rulesUrl: input.rulesUrl,
      reason,
    }),
  };
}
