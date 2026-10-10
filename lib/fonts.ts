import { JetBrains_Mono, M_PLUS_1, Saira } from "next/font/google";

/** Display face — headings, buttons, the wordmark. Used heavily in italic 900. */
export const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

/** Body face. */
export const mPlus1 = M_PLUS_1({
  variable: "--font-mplus",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

/** Monospace — terminal, flag format, clause numbers. */
export const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const fontVariables = [saira.variable, mPlus1.variable, jetBrainsMono.variable].join(" ");
