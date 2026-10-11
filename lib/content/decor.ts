/**
 * Copy and geometry for the purely decorative layers: the scrolling ticker,
 * the fake terminal session, and the drifting sky.
 */

/** The registration status item is added by the ticker itself, so it can follow the deadline. */
export const tickerItems = [
  "BY UNIVERSITY OF MINDANAO COLLEGE OF COMPUTING EDUCATION",
  "OPEN TO ALL CCE STUDENTS",
  "UNIVERSITY OF MINDANAO COLLEGE OF COMPUTING EDUCATION: SKILLS CLINIC",
  "JEOPARDY-STYLE",
];

export type TerminalLine = { text: string; color: string };

export const terminalLines: TerminalLine[] = [
  { text: "> connect schale.cte:1337", color: "#6FD3FF" },
  { text: "  handshake ............ OK", color: "#CFE6FF" },
  { text: "> auth --squad SENSEI_04", color: "#6FD3FF" },
  { text: "  access granted", color: "#9BF0B5" },
  { text: "> ls /missions", color: "#6FD3FF" },
  { text: "  web  crypto  forensics  osint  general  pwn", color: "#CFE6FF" },
  { text: "> cat flag.txt", color: "#6FD3FF" },
  { text: "  permission denied. crack it.", color: "#FA94B4" },
];

export type Cloud = { top: string; width: number; duration: number; delay: number; opacity: number };

export const clouds: Cloud[] = [
  { top: "8%", width: 340, duration: 70, delay: -10, opacity: 0.9 },
  { top: "30%", width: 220, duration: 55, delay: -40, opacity: 0.7 },
  { top: "62%", width: 420, duration: 90, delay: -25, opacity: 0.8 },
  { top: "18%", width: 180, duration: 48, delay: -5, opacity: 0.6 },
];

/** Twinkle positions as [x%, y%]. */
export const sparks: [number, number][] = [
  [12, 22],
  [38, 12],
  [56, 70],
  [82, 18],
  [92, 54],
  [24, 78],
  [68, 40],
  [6, 50],
];

export type Triangle = { x: number; size: number; duration: number; delay: number; color: string };

export const triangles: Triangle[] = [
  { x: 6, size: 26, duration: 16, delay: 0, color: "rgba(18,138,250,.22)" },
  { x: 18, size: 14, duration: 12, delay: -4, color: "rgba(255,216,77,.6)" },
  { x: 34, size: 34, duration: 20, delay: -9, color: "rgba(111,211,255,.3)" },
  { x: 52, size: 18, duration: 14, delay: -2, color: "rgba(18,138,250,.18)" },
  { x: 67, size: 24, duration: 18, delay: -12, color: "rgba(250,148,180,.35)" },
  { x: 81, size: 12, duration: 11, delay: -6, color: "rgba(255,216,77,.55)" },
  { x: 93, size: 30, duration: 22, delay: -15, color: "rgba(111,211,255,.28)" },
];

export type Bubble = { x: number; y: number; size: number; delay: number };

export const bubbles: Bubble[] = [
  { x: 8, y: 20, size: 90, delay: 0 },
  { x: 22, y: 70, size: 50, delay: -3 },
  { x: 44, y: 12, size: 36, delay: -6 },
  { x: 70, y: 60, size: 120, delay: -2 },
  { x: 88, y: 25, size: 60, delay: -5 },
  { x: 58, y: 85, size: 28, delay: -1 },
];

/** Hex lattice tile used behind the FAQ, inlined as a data URI. */
export const hexTileUrl = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="97" viewBox="0 0 56 97"><path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L28 97" fill="none" stroke="#128AFA" stroke-width="1.2"/></svg>',
)}")`;

/** Repeated behind the mission section as giant outlined text. */
export const outlineWord = "MISSION SELECT ✦ CRACK THE CODE ✦ ";
