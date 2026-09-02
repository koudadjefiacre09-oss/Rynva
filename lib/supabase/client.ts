import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components. Only call this when
 * `isSupabaseConfigured` is true — the underlying client throws immediately
 * if the URL/key env vars are missing.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
