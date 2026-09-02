import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Tarifs" };

const plans = [
  {
    name: "Free",
    price: "0€",
    period: "pour toujours",
    description: "Pour découvrir RYNVA et tester les cinq outils IA.",
    features: ["50 crédits offerts", "Accès à AI Image, Video, Design, Audio, Chat", "Historique 7 jours", "1 projet actif"],
    cta: "Commencer gratuitement",
    href: "/register",
    available: true,
  },
  {
    name: "Pro",
    price: "19€",
    period: "/ mois",
    description: "Pour les créateurs qui génèrent régulièrement.",
    features: ["1 000 crédits par mois", "Historique illimité", "Projets illimités", "Génération prioritaire"],
    cta: "Bientôt disponible",
    href: "/register",
    available: false,
  },
  {
    name: "Team",
    price: "49€",
    period: "/ mois",
    description: "Pour les équipes qui créent et collaborent ensemble.",
    features: ["5 000 crédits partagés", "Jusqu'à 5 membres", "Espace de travail partagé", "Support prioritaire"],
    cta: "Bientôt disponible",
    href: "/register",
    available: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-radial-glow px-6 pb-8 pt-32 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Des tarifs simples, <span className="text-gradient-brand">basés sur des crédits</span>
          </h1>
          <p className="mt-6 text-base text-text-secondary sm:text-lg">
            Commencez gratuitement. Les plans payants arrivent avec les abonnements Stripe (Phase 5)
            — en attendant, le plan Free est pleinement fonctionnel.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24 pt-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.available ? "border-brand-purple/50" : ""}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {!plan.available && <Badge variant="outline">Bientôt</Badge>}
                </div>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-semibold tracking-tight text-text-primary">
                    {plan.price}
                  </span>
                  <span className="text-sm text-text-muted">{plan.period}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.available ? (
                  <Link href={plan.href} className="w-full">
                    <Button className="w-full">{plan.cta}</Button>
                  </Link>
                ) : (
                  <Button className="w-full" variant="secondary" disabled>
                    {plan.cta}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
