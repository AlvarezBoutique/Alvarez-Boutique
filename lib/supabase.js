import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "./urls";

const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Read-only client for the public catalog. Returns null when the env vars are
 * absent so the app can fall back to bundled seed data instead of crashing.
 */
export function getSupabase() {
  if (!isSupabaseConfigured) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
