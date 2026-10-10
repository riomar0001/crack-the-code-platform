import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Server-side Supabase client authenticated with the secret key.
 *
 * Row Level Security is enabled on both tables with no policies, so this is
 * the only client that can read or write them — registration goes through the
 * server action, never straight from the browser. The `server-only` import
 * above makes an accidental client import a build error rather than a leak.
 */

let cached: SupabaseClient<Database> | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Copy your Supabase project credentials into .env — see README.md.`,
    );
  }

  return value;
}

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!cached) {
    cached = createClient<Database>(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SECRET_KEY"),
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { "x-application-name": "crack-the-code-landing" } },
      },
    );
  }

  return cached;
}
