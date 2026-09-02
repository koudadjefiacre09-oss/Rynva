/**
 * Whether real Supabase credentials are present. Every auth entry point
 * (server actions, middleware, protected layouts) checks this first so the
 * app keeps working exactly like Phase 1 until real keys are added to
 * .env.local — nothing here is simulated as if it worked without them.
 */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
