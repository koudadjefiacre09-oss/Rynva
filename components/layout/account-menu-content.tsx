"use client";

import Link from "next/link";
import {
  User,
  Settings,
  CreditCard,
  Crown,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  SunMoon,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/auth/actions";
import { notifySuccess } from "@/lib/toast";
import { type UserMenuUser } from "@/components/layout/user-menu";
import { initialsOf } from "@/lib/initials";
import { useTheme, type Theme } from "@/components/theme/theme-provider";
import type { Profile } from "@/lib/profiles/get";

const PLAN_BADGE: Record<string, string> = { free: "Free", pro: "Pro" };

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Clair" },
  { value: "dark", icon: Moon, label: "Sombre" },
  { value: "system", icon: SunMoon, label: "Système" },
];

/**
 * Shared body of the account dropdown — used by both UserMenu (topbar,
 * opens downward) and SidebarUserMenu (sidebar bottom, opens upward), which
 * only differ in their trigger button and panel position. Keeping the
 * content itself in one place means the two never drift apart.
 *
 * Row labels are text-sm, everything secondary (email, badges, the theme
 * switch) is text-xs — same scale the rest of the app's dropdowns use.
 */
export function AccountMenuContent({
  user,
  profile = null,
  isAdmin = false,
  onNavigate,
}: {
  user: UserMenuUser;
  profile?: Profile | null;
  isAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const planLabel = PLAN_BADGE[profile?.plan ?? "free"] ?? "Free";

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-sm font-semibold text-white">
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsOf(user.name)
          )}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
            {user.name}
          </span>
          <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">{user.email}</span>
        </div>
      </div>

      {profile?.plan !== "pro" && (
        <div className="px-3 pb-3">
          <Link
            href="/premium"
            role="menuitem"
            onClick={onNavigate}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Crown className="h-4 w-4" />
            Passer à RYNVA Pro
          </Link>
        </div>
      )}

      <div className="border-t border-zinc-100 py-1 dark:border-zinc-800">
        <MenuLink href="/profile" icon={User} label="Mon profil" onNavigate={onNavigate} />
        {/* Hidden from sm up: the topbar already has a standalone "Invite
            friends" button there (components/layout/topbar.tsx). Below sm
            that button is hidden for space, so it lives here instead. */}
        <button
          type="button"
          onClick={() => {
            const link = `${window.location.origin}/register?ref=${user.id}`;
            navigator.clipboard
              .writeText(link)
              .then(() => notifySuccess("Lien d'invitation copié !"))
              .catch(() => {
                /* clipboard denied — nothing sensible to do, fail silently */
              });
            onNavigate?.();
          }}
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white sm:hidden"
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          Inviter des amis
        </button>
        <MenuLink
          href="/premium"
          icon={CreditCard}
          label="Abonnement et facturation"
          onNavigate={onNavigate}
          trailing={
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {planLabel}
            </span>
          }
        />
        <MenuLink href="/settings" icon={Settings} label="Réglages" onNavigate={onNavigate} />

        <div className="flex items-center gap-2.5 px-4 py-2.5">
          <SunMoon className="h-4 w-4 shrink-0 text-zinc-700 dark:text-zinc-300" />
          <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">Thème</span>
          <div className="flex items-center gap-0.5 rounded-full bg-zinc-100 p-0.5 dark:bg-zinc-800">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  aria-label={opt.label}
                  aria-pressed={active}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors",
                    active
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>

        {isAdmin && (
          <MenuLink href="/admin" icon={ShieldCheck} label="Administration" onNavigate={onNavigate} />
        )}

        <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
        <form action={logout}>
          <button
            type="submit"
            role="menuitem"
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </form>
      </div>
    </>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  trailing,
  onNavigate,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  trailing?: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {trailing}
    </Link>
  );
}
