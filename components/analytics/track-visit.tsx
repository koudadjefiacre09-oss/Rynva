"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Mounted once in the root layout — fires a best-effort beacon to
 * /api/track-visit on first load and on every client-side navigation
 * (usePathname changes), backing the "Trafic du site" section on /admin.
 * Renders nothing; failures are silently ignored, this must never affect
 * the page around it.
 */
export function TrackVisit() {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {
      /* best-effort — a dropped beacon is never worth surfacing to the visitor */
    });
  }, [pathname]);

  return null;
}
