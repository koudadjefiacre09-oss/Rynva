import Image from "next/image";
import Link from "next/link";

const columns = [
  {
    title: "Produit",
    links: [
      { href: "/features", label: "Fonctionnalités" },
      { href: "/pricing", label: "Tarifs" },
      { href: "/ai/chat", label: "AI Chat" },
    ],
  },
  {
    title: "Entreprise",
    links: [{ href: "/about", label: "À propos" }],
  },
  {
    title: "Compte",
    links: [
      { href: "/login", label: "Connexion" },
      { href: "/register", label: "Créer un compte" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-cream px-6 py-14 font-display text-ink">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="RYNVA" width={26} height={26} />
            <span className="text-base font-semibold tracking-tight">RYNVA</span>
          </Link>
          <p className="mt-3 max-w-[220px] text-sm text-ink-muted">
            Créez, éditez et innovez avec l&apos;IA — dans un seul studio.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-medium text-ink">{column.title}</p>
            <ul className="mt-3 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-muted hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-ink/10 pt-6 text-xs text-ink-muted">
        © {new Date().getFullYear()} RYNVA. Tous droits réservés.
      </div>
    </footer>
  );
}
