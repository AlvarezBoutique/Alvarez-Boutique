"use client";

import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

/**
 * Browser client for /admin. Unlike lib/supabase.js (read-only, server-side, no
 * session), this one persists the session so a refresh doesn't sign the owner out.
 */
export const supabase = supabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "alvarez_auth",
      },
    })
  : null;

/**
 * Owners sign in with a username, never a real email. Supabase Auth still handles
 * the password hashing and sessions underneath, so we map each username onto a
 * fictitious address that never leaves the app.
 */
export function emailForUsername(username) {
  return `${username.trim().toLowerCase()}@alvarez.local`;
}
