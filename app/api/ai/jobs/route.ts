import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/ai/route-helpers";
import { refreshActiveJobs, videoJobsEnabled } from "@/lib/ai/video-jobs.server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The signed-in user's videos still being generated. Each is re-checked and,
 * if done, saved right away: coming back to RYNVA after closing the tab is
 * enough to recover a video, even without the webhook configured.
 */
export async function GET() {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;
  if (!userId || !videoJobsEnabled) return NextResponse.json({ jobs: [] });

  try {
    const jobs = await refreshActiveJobs(userId);
    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("[api/ai/jobs]", err);
    return NextResponse.json({ jobs: [] });
  }
}
