import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "pour toujours",
    description: "Pour découvrir RYNVA et tester les six outils IA.",
    features: ["50 crédits offerts", "Accès à Image, Vidéo, Photo, Design, Audio, Chat", "Historique 7 jours", "1 projet actif"],
    cta: "Commencer gratuitement",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$14.00",
    period: "/ mois",
    description: "Pour les créateurs qui génèrent sans limite.",
    features: ["Crédits illimités", "Historique illimité", "Projets illimités", "Génération prioritaire", "Qualité 4K"],
    cta: "Passer à Rynva Pro",
    // Route Stripe pas encore implémentée — sera créée en Phase 5.
    href: "/api/stripe/checkout?plan=pro",
    highlight: true,
  },
];

export function PricingTeaser() {
  return (
    <section className="relative overflow-hidden bg-black px-6 py-24">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-96 bg-[radial-gradient(ellipse_at_bottom,_theme(colors.orange.600/0.15),_transparent_65%)]" />

      <div className="relative mx-auto max-w-4xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Des tarifs simples, pensés pour créer
          </h2>
          <p className="mt-3 text-zinc-400">
            Commencez gratuitement, passez Pro quand vous êtes prêt à créer sans limite.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-7 ${
                plan.highlight
                  ? "border-orange-600/50 bg-gradient-to-b from-orange-600/10 to-zinc-950 shadow-[0_0_60px_-20px_rgba(234,88,12,0.5)]"
                  : "border-zinc-800 bg-zinc-950/60"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-3 py-1 text-xs font-medium text-white">
                  Recommandé
                </span>
              )}

              <p className="text-lg font-semibold text-white">{plan.name}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-white">{plan.price}</span>
                <span className="text-sm text-zinc-500">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm text-zinc-400">{plan.description}</p>

              <ul className="mt-6 flex flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="mt-7 block">
                <Button
                  className={`w-full ${
                    plan.highlight
                      ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white hover:brightness-110"
                      : "border border-zinc-800 bg-zinc-900 text-white hover:border-orange-600/50"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
