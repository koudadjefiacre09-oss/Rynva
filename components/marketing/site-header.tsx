import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProfile, type Profile } from "@/lib/profiles/get";

const navLinks = [
  { href: "/features", label: "Fonctionnalités" },
  { href: "/pricing", label: "Tarifs" },
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
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="RYNVA" width={26} height={26} />
          <span className="text-base font-semibold tracking-tight">RYNVA</span>
        </Link>

        <nav className="ml-10 hidden items-center gap-7 text-sm text-text-secondary md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Aller au dashboard
                </Button>
              </Link>
              <UserMenu user={user} profile={profile} />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Commencer</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
