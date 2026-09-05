import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Layers, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "À propos" };

const values = [
  {
    icon: Sparkles,
    title: "Créer sans friction",
    desc: "Passer d'une idée à un rendu final ne devrait jamais demander de jongler entre dix outils différents.",
  },
  {
    icon: Layers,
    title: "Un studio, pas une liste d'outils",
    desc: "Image, vidéo, design, audio et chat partagent la même interface, le même historique, les mêmes crédits.",
  },
  {
    icon: ShieldCheck,
    title: "Construit honnêtement",
    desc: "Aucune fonctionnalité de RYNVA n'est présentée comme fonctionnelle avant de l'être réellement.",
  },
];

const steps = [
  { step: "01", title: "Décrivez votre idée", desc: "Un prompt texte suffit pour démarrer, quel que soit l'outil." },
  { step: "02", title: "Générez et itérez", desc: "Ajustez le format, régénérez, comparez les résultats dans votre historique." },
  { step: "03", title: "Exportez ou continuez", desc: "Récupérez votre création ou enchaînez avec un autre outil du studio." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-radial-glow px-6 pb-16 pt-32 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Un studio créatif, <span className="text-gradient-brand">pensé pour aller vite</span>
          </h1>
          <p className="mt-6 text-base text-text-secondary sm:text-lg">
            RYNVA est né d&apos;un constat simple : créer avec l&apos;IA aujourd&apos;hui veut dire
            multiplier les outils, les onglets et les abonnements. RYNVA réunit l&apos;essentiel :
            image, vidéo, design, audio et chat, dans un seul studio.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="p-6">
                  <CardContent className="flex flex-col items-start gap-3 p-0">
                    <Icon className="h-6 w-6 text-brand-purple" strokeWidth={1.75} />
                    <p className="text-sm font-medium text-text-primary">{value.title}</p>
                    <p className="text-sm text-text-secondary">{value.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface/40 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Comment ça marche
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="text-center sm:text-left">
                <span className="text-sm font-semibold text-brand-purple">{s.step}</span>
                <p className="mt-2 text-sm font-medium text-text-primary">{s.title}</p>
                <p className="mt-1.5 text-sm text-text-secondary">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Envie de créer avec nous ?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-text-secondary">
          RYNVA est en construction active. Le plan Free est déjà ouvert à tous.
        </p>
        <Link href="/register" className="mt-8 inline-block">
          <Button size="lg">Créer un compte</Button>
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
