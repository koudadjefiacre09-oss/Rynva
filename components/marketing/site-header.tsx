import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProfile, type Profile } from "@/lib/profiles/get";

// Kept to 4 links to stay close to the reference nav's proportions —
// "Exemples" is still on the page (reachable by scroll), just not in the nav.
const navLinks = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/about", label: "À propos" },
];

export async function SiteHeader() {
  let user: { id: string; name: string; email: string } | null = null;
  let profile: Profile | null = null;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      user = {
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email || "Utilisateur",
        email: authUser.email ?? "",
      };
      profile = await getProfile(authUser.id);
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
        <Link href="/" className="flex items-center">
          <Image src="/logo-icon.png" alt="RYNVA" width={40} height={40} className="h-10 w-10" priority />
        </Link>

        <nav className="ml-10 hidden items-center gap-6 text-sm font-medium text-ink md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative py-1 transition-opacity hover:opacity-60 [text-wrap:nowrap]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full border-ink/15 bg-white font-semibold text-ink hover:border-ink/30"
                >
                  Aller au dashboard
                </Button>
              </Link>
              <UserMenu user={user} profile={profile} />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full border-ink/15 bg-white font-semibold text-ink hover:border-ink/30"
                >
                  Connexion
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gap-1 rounded-full bg-ink font-semibold text-white hover:brightness-110">
                  Commencer
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
