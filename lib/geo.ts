import { headers } from "next/headers";

/**
 * Best-effort country code from the request — only populated when the app
 * runs behind an edge network that sets it (e.g. Vercel's `x-vercel-ip-country`).
 * Returns null everywhere else (local dev, other hosts) — there's no IP
 * geolocation service wired into this app, so we never guess.
 */
export async function getCountryFromRequest(): Promise<string | null> {
  const h = await headers();
  return h.get("x-vercel-ip-country") ?? null;
}
