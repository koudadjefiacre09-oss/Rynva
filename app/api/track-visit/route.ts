import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { recordVisit } from "@/lib/visits/record";

/**
 * Fire-and-forget page-view beacon — called once per navigation by
 * components/analytics/track-visit.tsx. No auth required: this tracks
 * overall site traffic (marketing pages included), not just the
 * authenticated app, and carries nothing more identifying than the country
 * header Vercel already attaches to the request (see lib/geo.ts).
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const path = typeof json?.path === "string" && json.path ? json.path : "/";

  const h = await headers();
  const country = h.get("x-vercel-ip-country");

  await recordVisit(path, country);
  return NextResponse.json({ ok: true });
}
