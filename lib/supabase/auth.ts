import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for signing people in and checking their sessions.
 *
 * Uses the publishable key, not the secret one: it can only do what a signed-in
 * user could do, and it never touches the registration tables (those are
 * locked by Row Level Security and reached only through `getSupabaseAdmin`).
 * Stateless on purpose — the app keeps the session in its own cookie.
 */
export function getSupabaseAuth(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — see README.md.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
