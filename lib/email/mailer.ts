import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { describeError } from "@/lib/errors";

/**
 * Outgoing mail over SMTP.
 *
 *   SMTP_HOST      mail server, e.g. smtp.example.com
 *   SMTP_PORT      465 (implicit TLS) or 587 (STARTTLS)
 *   SMTP_USER      login, if the server needs one
 *   SMTP_PASSWORD  password or app password
 *   SMTP_FROM      sender, e.g. `Crack The Code <hello@example.com>`
 *
 * Mail is a courtesy on top of registration, never a requirement: with no
 * SMTP settings, or a mail server that is down, `sendMail` logs and returns
 * `false` instead of throwing, so a team is never lost to an email problem.
 */

type MailConfig = {
  host: string;
  port: number;
  user?: string;
  password?: string;
  from: string;
};

export type Mail = {
  /** One address, or several for a single message to a whole squad. */
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

function getConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.SMTP_FROM?.trim();

  if (!host || !from) return null;

  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER?.trim() || undefined;
  const password = process.env.SMTP_PASSWORD || undefined;

  return { host, port, user, password, from };
}

let cached: { transporter: Transporter; from: string } | null = null;

function getTransport() {
  if (cached) return cached;

  const config = getConfig();
  if (!config) return null;

  cached = {
    from: config.from,
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      // 465 speaks TLS from the first byte; anything else upgrades via STARTTLS.
      secure: config.port === 465,
      auth: config.user ? { user: config.user, pass: config.password } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    }),
  };

  return cached;
}

/** Whether SMTP is configured at all. */
export const isMailConfigured = () => getConfig() !== null;

/**
 * Sends one message. Resolves `true` when the server accepted it for at least
 * one recipient; any addresses it refused are logged.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const transport = getTransport();

  if (!transport) {
    console.warn("[mail] SMTP is not configured (SMTP_HOST / SMTP_FROM); skipping email.");
    return false;
  }

  try {
    const info = await transport.transporter.sendMail({
      from: transport.from,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    // A multi-recipient message can be accepted for some and refused for
    // others; the server reports which.
    const address = (entry: string | { address: string }) =>
      typeof entry === "string" ? entry : entry.address;

    const rejected = (info.rejected ?? []).map(address);
    if (rejected.length > 0) {
      console.warn("[mail] recipients refused by the server:", rejected.join(", "));
    }

    return (info.accepted ?? []).length > 0;
  } catch (error) {
    console.error("[mail] send failed:", describeError(error));
    return false;
  }
}

/** Connects and authenticates without sending anything. For diagnostics. */
export async function verifyMail(): Promise<{ ok: boolean; detail: string }> {
  const transport = getTransport();
  if (!transport) return { ok: false, detail: "SMTP is not configured." };

  try {
    await transport.transporter.verify();
    return { ok: true, detail: "SMTP connection and login succeeded." };
  } catch (error) {
    return { ok: false, detail: describeError(error) };
  }
}
