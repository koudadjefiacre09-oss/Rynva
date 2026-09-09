import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = { title: "Politique de confidentialité" };

// Baseline privacy policy reflecting what RYNVA actually does today (see
// lib/supabase, lib/ai/providers, Stripe, Resend integrations) — same
// "don't claim what isn't real" rule as the rest of the product. Not a
// substitute for legal review before scaling.
const sections = [
  {
    title: "1. Qui sommes-nous",
    body: [
      "RYNVA est un studio de création par IA (image, vidéo, design, audio, chat). Pour toute question sur cette politique ou vos données, écrivez-nous à hello@rynva.app.",
    ],
  },
  {
    title: "2. Données que nous collectons",
    body: [
      "Compte : adresse e-mail et mot de passe (géré par notre prestataire d'authentification, jamais stocké en clair par RYNVA).",
      "Contenu : les prompts que vous saisissez et les créations (images, vidéos, designs, audio, messages de chat) que vous générez, ainsi que votre historique de génération.",
      "Facturation : si vous souscrivez au plan Pro, les informations de paiement sont traitées directement par notre prestataire de paiement — RYNVA ne stocke jamais votre numéro de carte.",
      "Usage technique : journaux d'activité (type d'action, date, statut) utilisés pour le suivi de votre quota et le support.",
    ],
  },
  {
    title: "3. Comment nous utilisons ces données",
    body: [
      "Fournir et faire fonctionner le service (authentification, génération de contenu, historique, facturation).",
      "Vous envoyer des e-mails transactionnels nécessaires au service (confirmation de compte, réinitialisation de mot de passe).",
      "Assurer le support et corriger les problèmes techniques.",
      "RYNVA ne vend ni ne loue vos données personnelles à des tiers.",
    ],
  },
  {
    title: "4. Sous-traitants et fournisseurs tiers",
    body: [
      "Pour fonctionner, RYNVA s'appuie sur des prestataires spécialisés, chacun avec un rôle précis :",
      "Hébergement et authentification de votre compte (base de données, connexion).",
      "Paiement (plan Pro) — traité par un prestataire de paiement certifié, RYNVA ne voit jamais vos données bancaires complètes.",
      "Génération de contenu — vos prompts sont transmis à un ou plusieurs fournisseurs de modèles d'IA tiers (image/vidéo/design/audio, et chat) pour produire le résultat demandé. Ces fournisseurs traitent la requête le temps de la génération, selon leurs propres conditions.",
      "Envoi d'e-mails transactionnels.",
      "Hébergement de l'application.",
      "Chacun de ces prestataires n'accède qu'aux données strictement nécessaires à sa fonction.",
    ],
  },
  {
    title: "5. Conservation des données",
    body: [
      "Vos données de compte et votre historique de génération sont conservés tant que votre compte est actif. Vous pouvez demander la suppression de votre compte et des données associées à tout moment en nous contactant.",
    ],
  },
  {
    title: "6. Vos droits",
    body: [
      "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Pour exercer l'un de ces droits, contactez-nous à hello@rynva.app — nous répondons sous un délai raisonnable.",
    ],
  },
  {
    title: "7. Cookies",
    body: [
      "RYNVA utilise uniquement les cookies strictement nécessaires au fonctionnement du service (maintien de votre session de connexion). Aucun cookie publicitaire ou de tracking tiers n'est utilisé aujourd'hui.",
    ],
  },
  {
    title: "8. Sécurité",
    body: [
      "Nous prenons des mesures raisonnables pour protéger vos données (connexions chiffrées, mots de passe jamais stockés en clair). Aucun système n'est infaillible à 100 % ; en cas d'incident de sécurité affectant vos données, nous vous en informerons dans les meilleurs délais.",
    ],
  },
  {
    title: "9. Modifications de cette politique",
    body: [
      "Cette politique peut évoluer à mesure que RYNVA ajoute des fonctionnalités. La date de dernière mise à jour figure en haut de cette page ; les changements significatifs vous seront signalés.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="px-6 pb-16 pt-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Politique de confidentialité
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
