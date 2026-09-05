"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    description: "Pour découvrir RYNVA et tester les six outils IA.",
    monthly: 0,
    features: ["50 crédits offerts", "Accès à Image, Vidéo, Photo, Design, Audio, Chat", "Historique 7 jours", "1 projet actif"],
    cta: "Commencer gratuitement",
    href: "/register",
    highlight: false,
    available: true,
  },
  {
    name: "Pro",
    description: "Pour les créateurs qui génèrent sans limite.",
    monthly: 14,
    features: ["Crédits illimités", "Historique illimité", "Projets illimités", "Génération prioritaire", "Qualité 4K"],
    cta: "Passer à Rynva Pro",
    // Route Stripe pas encore implémentée — sera créée en Phase 5.
    href: "/api/stripe/checkout?plan=pro",
    highlight: true,
    available: true,
  },
  {
    name: "Team",
    description: "Pour les équipes qui créent et collaborent ensemble.",
    monthly: 49,
    features: ["Crédits partagés illimités", "Jusqu'à 5 membres", "Espace de travail partagé", "Support prioritaire"],
    cta: "Bientôt disponible",
    href: "/register",
    highlight: false,
    available: false,
  },
];

export function PricingTeaser() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="tarifs" className="relative scroll-mt-24 border-t border-ink/10 bg-cream px-6 py-24">
      <div className="relative mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Tarifs</p>
          <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
            Des tarifs simples, <span className="font-display-serif italic">sans surprise</span>
          </h2>
          <p className="mt-3 text-ink-muted">Aucun frais caché. Annulez à tout moment.</p>

          <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-ink/10 bg-white p-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !annual ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                annual ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
              }`}
            >
              Annuel
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {plans.map((plan, i) => {
            const price = plan.monthly === 0 ? 0 : annual ? Math.round(plan.monthly * 0.8) : plan.monthly;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`relative rounded-3xl border p-7 transition-transform duration-300 hover:-translate-y-1.5 ${
                  plan.highlight
                    ? "border-ink bg-ink text-white shadow-[0_24px_60px_-24px_rgba(20,20,18,0.45)]"
                    : "border-ink/10 bg-white hover:border-ink/25"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                    Le plus populaire
                  </span>
                )}

                <p className={`text-lg font-semibold ${plan.highlight ? "text-white" : "text-ink"}`}>{plan.name}</p>
                <p className={`mt-1 text-sm ${plan.highlight ? "text-white/60" : "text-ink-muted"}`}>{plan.description}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className={`text-4xl font-medium tracking-tight ${plan.highlight ? "text-white" : "text-ink"}`}>
                    ${price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? "text-white/50" : "text-ink-muted"}`}>
                    {plan.monthly === 0 ? "pour toujours" : "/ mois"}
                  </span>
                </div>

                <ul className="mt-6 flex flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-start gap-2 text-sm ${plan.highlight ? "text-white/80" : "text-ink-muted"}`}
                    >
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlight ? "text-blue-400" : "text-emerald-600"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href={plan.href} className="mt-7 block">
                  <Button
                    disabled={!plan.available}
                    className={`w-full rounded-full transition-transform hover:scale-[1.02] disabled:hover:scale-100 ${
                      plan.highlight
                        ? "bg-white text-ink hover:brightness-95"
                        : "border border-ink/15 bg-cream text-ink hover:border-ink/30"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-ink-muted">
          Les plans Pro et Team arrivent avec les abonnements Stripe. Le plan Free est pleinement fonctionnel dès maintenant.
        </p>
      </div>
    </section>
  );
}
