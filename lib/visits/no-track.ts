"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "rynva_no_track";
const FIVE_YEARS = 60 * 60 * 24 * 365 * 5;

/** Whether this browser has opted out of visit tracking (see the toggle on /admin). */
export async function isNoTrackEnabled(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "1";
}

/**
 * Sets or clears the opt-out cookie for the current browser. Deliberately a
 * long-lived cookie rather than tied to the admin's account: it needs to
 * also cover them browsing the public marketing pages logged out (a fresh
 * tab, incognito testing, etc.), not just their authenticated app session.
 */
export async function setNoTrack(enabled: boolean): Promise<void> {
  const store = await cookies();
  if (enabled) {
    store.set(COOKIE_NAME, "1", { maxAge: FIVE_YEARS, path: "/" });
  } else {
    store.delete(COOKIE_NAME);
  }
}
