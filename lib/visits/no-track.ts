import { cookies } from "next/headers";

export const NO_TRACK_COOKIE = "rynva_no_track";

/**
 * Whether this browser has opted out of visit tracking (see the toggle on
 * /admin, and the mutation in lib/visits/set-no-track.ts). Plain
 * server-only function, not a Server Action — called directly during
 * /admin's render. Deliberately kept out of any file a Client Component
 * imports: next/headers can't be bundled client-side, and mixing this with
 * the actual "use server" mutation in one module broke exactly that way in
 * production (a plain read got wrapped as an action too, and crashed when
 * called straight from render instead of dispatched as one).
 */
export async function isNoTrackEnabled(): Promise<boolean> {
  const store = await cookies();
  return store.get(NO_TRACK_COOKIE)?.value === "1";
}
