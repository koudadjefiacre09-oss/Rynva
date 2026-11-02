"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import { notifySuccess } from "@/lib/toast";

interface JobEntry {
  id: string;
  prompt: string | null;
  createdAt: string;
  result: { status: "processing" | "succeeded" | "failed" | "not-found" | "forbidden" };
}

const POLL_MS = 20_000;

/**
 * Topbar pill showing videos still being generated. Polling /api/ai/jobs
 * also finalizes jobs that finished while the user was away, so a video
 * started before closing the tab lands in Projets on the next visit.
 */
export function ActiveJobs() {
  const [active, setActive] = useState<JobEntry[]>([]);
  const known = useRef(new Set<string>());
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/jobs", { cache: "no-store" });
      if (!res.ok) return;
      const { jobs } = (await res.json()) as { jobs: JobEntry[] };
      const finished = jobs.filter((j) => j.result.status === "succeeded");
      // Toast only for jobs this tab saw in progress (avoids duplicate toasts
      // with the studio page, which announces its own result).
      if (finished.some((j) => known.current.has(j.id)) && !window.location.pathname.startsWith("/ai/video")) {
        notifySuccess("Votre vidéo est prête : retrouvez-la dans vos projets.");
      }
      if (finished.length) router.refresh();
      const still = jobs.filter((j) => j.result.status === "processing");
      still.forEach((j) => known.current.add(j.id));
      setActive(still);
    } catch {
      /* offline: try again later */
    }
  }, [router]);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const onStart = () => setTimeout(refresh, 1500);
    window.addEventListener("rynva:job-started", onStart);
    return () => {
      clearTimeout(first);
      window.removeEventListener("rynva:job-started", onStart);
    };
  }, [refresh]);

  useEffect(() => {
    if (active.length === 0) return;
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [active.length, refresh]);

  if (active.length === 0) return null;

  return (
    <Link
      href="/ai/video"
      title={active.map((j) => j.prompt ?? "Vidéo").join("\n")}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-zinc-200 border-t-brand-purple dark:border-zinc-700" />
        <Video className="h-2.5 w-2.5" />
      </span>
      <span className="hidden sm:inline">
        {active.length} vidéo{active.length > 1 ? "s" : ""} en cours
      </span>
      <span className="sm:hidden">{active.length}</span>
    </Link>
  );
}
