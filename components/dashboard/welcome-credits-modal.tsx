"use client";

import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Video, X } from "lucide-react";
import { markWelcomeShown } from "@/app/(app)/dashboard/actions";

const CONFETTI_COLORS = ["#7C5CFF", "#38BDF8", "#F472B6", "#FBBF24", "#34D399"];
const CONFETTI_PIECES = 60;

interface WelcomeCreditsModalProps {
  imagesGranted: number;
  videosGranted: number;
  /** ISO date string — when this trial's quota stops working. */
  expiresAt: string;
}

/**
 * "Félicitations" modal shown once on a new signup's first /dashboard visit
 * (gated by profiles.welcome_shown — see app/(app)/dashboard/actions.ts and
 * migration 0014). Styled after the confetti-and-emoji confirmation you get
 * after buying a domain on Cloudflare: a quick, celebratory one-off, not
 * something that lingers in the UI.
 */
export function WelcomeCreditsModal({ imagesGranted, videosGranted, expiresAt }: WelcomeCreditsModalProps) {
  const [open, setOpen] = useState(true);

  // Randomized once per mount, not per render — re-rolling on every render
  // would make the confetti jump around instead of falling smoothly.
  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI_PIECES }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.5 + Math.random() * 1.5,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        width: 5 + Math.random() * 5,
        rotate: Math.round(Math.random() * 360),
      })),
    []
  );

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function close() {
    setOpen(false);
    // Fire-and-forget — the modal's already closing; a failed write here
    // just means it might show again next visit, not worth blocking on.
    markWelcomeShown();
  }

  if (!open) return null;

  const dateLabel = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(expiresAt));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="absolute top-0 animate-confetti-fall rounded-sm"
            style={{
              left: `${c.left}%`,
              width: c.width,
              height: c.width * 0.4,
              backgroundColor: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-7 text-center shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={close}
          aria-label="Fermer"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand text-3xl">
          🎉
        </div>

        <h2 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Félicitations, bienvenue sur RYNVA !
        </h2>
        <p className="mt-2 text-sm text-zinc-500">Votre essai gratuit est activé avec :</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
            <ImageIcon className="mx-auto h-5 w-5 text-brand-purple" />
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{imagesGranted}</p>
            <p className="text-xs text-zinc-500">images</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
            <Video className="mx-auto h-5 w-5 text-brand-purple" />
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{videosGranted}</p>
            <p className="text-xs text-zinc-500">vidéos</p>
          </div>
        </div>

        <p className="mt-5 text-xs text-zinc-400">
          Valable jusqu&rsquo;au {dateLabel}. Passez à RYNVA Pro à tout moment pour continuer sans limite.
        </p>

        <button
          type="button"
          onClick={close}
          className="mt-6 w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition-colors hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Commencer à créer
        </button>
      </div>
    </div>
  );
}
