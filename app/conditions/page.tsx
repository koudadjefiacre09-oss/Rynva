import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

// Baseline terms reflecting what RYNVA actually offers today (free-trial
// quota + Pro plan, third-party AI providers, no guarantee of 100% uptime
// since generation depends on those providers) — same "don't claim what
// isn't real" rule as the rest of the product (see app/about/page.tsx).
// Not a substitute for legal review before scaling.
const sections = [
  {
    title: "1. Acceptation des conditions",
    body: [
      "En créant un compte ou en utilisant RYNVA, vous acceptez les présentes conditions d'utilisation. Si vous n'êtes pas d'accord, merci de ne pas utiliser le service.",
    ],
  },
  {
    title: "2. Le service",
    body: [
      "RYNVA est un studio de création par intelligence artificielle proposant des outils de génération d'image, vidéo, design, audio et de chat, réunis dans une seule interface.",
      "Les générations sont produites par des modèles d'IA tiers ; RYNVA ne garantit pas un résultat identique à chaque exécution, ni une disponibilité de 100 % du service (les fournisseurs d'IA tiers peuvent connaître des interruptions indépendantes de notre volonté).",
    ],
  },
  {
    title: "3. Comptes utilisateurs",
    body: [
      "Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toute activité effectuée depuis votre compte. Prévenez-nous immédiatement à hello@rynva.app en cas d'usage non autorisé suspecté.",
    ],
  },
  {
    title: "4. Abonnements et facturation",
    body: [
      "RYNVA propose un plan gratuit avec un quota limité de générations, et un plan Pro payant sans ces limites. Les paiements du plan Pro sont traités par un prestataire de paiement tiers.",
      "Sauf obligation légale contraire, les sommes déjà facturées ne sont pas remboursables. Vous pouvez résilier votre abonnement Pro à tout moment ; l'accès reste actif jusqu'à la fin de la période déjà payée.",
    ],
  },
  {
    title: "5. Contenu généré et utilisation acceptable",
    body: [
      "Vous restez propriétaire des contenus que vous générez via RYNVA, dans la limite des droits que les fournisseurs de modèles d'IA sous-jacents accordent sur leurs propres résultats.",
      "Vous vous engagez à ne pas utiliser RYNVA pour produire ou diffuser du contenu illégal, haineux, diffamatoire, ou portant atteinte aux droits d'un tiers. RYNVA se réserve le droit de suspendre ou résilier un compte en cas d'usage abusif.",
    ],
  },
  {
    title: "6. Limitation de responsabilité",
    body: [
      "RYNVA est fourni « en l'état ». Dans la mesure permise par la loi, RYNVA ne pourra être tenu responsable des dommages indirects résultant de l'utilisation du service, y compris ceux liés à l'indisponibilité ou aux résultats d'un fournisseur d'IA tiers.",
    ],
  },
  {
    title: "7. Résiliation",
    body: [
      "Vous pouvez supprimer votre compte à tout moment en nous contactant. RYNVA peut suspendre ou résilier un compte en cas de violation de ces conditions.",
    ],
  },
  {
    title: "8. Modifications des conditions",
    body: [
      "Ces conditions peuvent évoluer à mesure que RYNVA ajoute des fonctionnalités. La date de dernière mise à jour figure en haut de cette page ; les changements significatifs vous seront signalés.",
    ],
  },
  {
    title: "9. Contact",
    body: ["Pour toute question sur ces conditions, écrivez-nous à hello@rynva.app."],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="px-6 pb-16 pt-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Conditions d&apos;utilisation
          </h1>
          <p className="mt-3 text-sm text-text-secondary">
            Dernière mise à jour : septembre 2026
          </p>

          <div className="mt-12 flex flex-col gap-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-semibold text-text-primary">{section.title}</h2>
                <div className="mt-3 flex flex-col gap-2.5">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-relaxed text-text-secondary">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
