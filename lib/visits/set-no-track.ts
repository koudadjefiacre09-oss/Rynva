"use server";

import { cookies } from "next/headers";
import { NO_TRACK_COOKIE } from "@/lib/visits/no-track";

const FIVE_YEARS = 60 * 60 * 24 * 365 * 5;

/**
 * Sets or clears the opt-out cookie for the current browser (called from
 * components/admin/no-track-toggle.tsx, a Client Component — this is why it
 * needs its own file-level "use server": Next.js only accepts an action
 * imported by client code from a module that's *entirely* actions, not a
 * function-level directive mixed in with a plain export like
 * lib/visits/no-track.ts's isNoTrackEnabled).
 *
 * Deliberately a long-lived cookie rather than tied to the admin's account:
 * it needs to also cover them browsing the public marketing pages logged
 * out (a fresh tab, incognito testing, etc.), not just their authenticated
 * app session.
 */
export async function setNoTrack(enabled: boolean): Promise<void> {
  const store = await cookies();
  if (enabled) {
    store.set(NO_TRACK_COOKIE, "1", { maxAge: FIVE_YEARS, path: "/" });
  } else {
    store.delete(NO_TRACK_COOKIE);
  }
}
