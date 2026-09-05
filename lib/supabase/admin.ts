import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 * Server-only, and only ever for admin-gated code (see lib/admin/auth.ts):
 * this is the one client in the app that can read/write every user's rows,
 * list/ban/delete auth accounts, etc. Never import this from a client
 * component, and never call it before requireAdmin() has run.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante. Ajoutez-la dans .env.local (Project Settings → API dans Supabase) pour activer l'espace admin."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Whether the service role key is configured — same graceful-degradation pattern as isSupabaseConfigured. */
export const isAdminConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);
