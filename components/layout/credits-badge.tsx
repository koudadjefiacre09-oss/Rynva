import Link from "next/link";
import { Image as ImageIcon, Video, Crown } from "lucide-react";
import type { Profile } from "@/lib/profiles/get";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

/**
 * What the user can still generate, always visible (also on phones):
 * remaining images/videos on the free trial, "Pro" when unmetered.
 * Replaces the old "N crédits utilisés" counter, which showed consumption
 * (an admin metric) instead of what's left.
 */
export function CreditsBadge({ profile }: { profile: Profile | null }) {
  if (!profile) return null;
  const base =
    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-90";

  if (profile.plan === "pro" || !profile.creditsExpireAt) {
    return (
      <span title="Générations illimitées" className={`${base} bg-gradient-brand text-white`}>
        <Crown className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{profile.plan === "pro" ? "Pro" : "Illimité"}</span>
      </span>
    );
  }

  const expiresAt = new Date(profile.creditsExpireAt);
  if (expiresAt < new Date()) {
    return (
      <Link href="/premium" className={`${base} bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300`}>
        Essai terminé
      </Link>
    );
  }

  const empty = profile.imagesRemaining <= 0 && profile.videosRemaining <= 0;
  return (
    <Link
      href="/premium"
      title={`${profile.imagesRemaining} image(s) et ${profile.videosRemaining} vidéo(s) restantes, jusqu'au ${dateFormatter.format(expiresAt)}`}
      className={`${base} ${empty ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" : "bg-gradient-brand text-white"}`}
    >
      <ImageIcon className="h-3.5 w-3.5" />
      <span className="tabular-nums">{profile.imagesRemaining}</span>
      <span className="opacity-60">·</span>
      <Video className="h-3.5 w-3.5" />
      <span className="tabular-nums">{profile.videosRemaining}</span>
      <span className="hidden lg:inline">restants</span>
    </Link>
  );
}
