import type { Metadata } from "next";
import Link from "next/link";
import {
  Image as ImageIcon,
  Video,
  Camera,
  Palette,
  AudioLines,
  MessageSquare,
  FolderKanban,
  History,
  Star,
  Bell,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Fonctionnalités" };

const tools = [
  {
    icon: ImageIcon,
    label: "Image",
    desc: "Générez des visuels originaux à partir d'un simple prompt texte : illustrations, photos réalistes, concept art.",
  },
  {
    icon: Video,
    label: "Video",
    desc: "Transformez une idée ou une image en vidéo courte, prête pour vos réseaux ou vos présentations.",
  },
  {
    icon: Camera,
    label: "Photo",
    desc: "Importez une photo et retirez son arrière-plan instantanément, sans logiciel de retouche.",
  },
  {
    icon: Palette,
    label: "Design",
    desc: "Créez des designs pour posts, stories, affiches et bannières, adaptés au bon format en un clic.",
  },
  {
    icon: AudioLines,
    label: "Audio",
    desc: "Générez voix off, musiques d'ambiance et effets sonores pour habiller vos créations.",
  },
  {
    icon: MessageSquare,
    label: "Chat",
    desc: "Un assistant créatif pour affiner un brief, explorer des idées ou itérer sur un prompt.",
  },
];

const platformFeatures = [
  {
    icon: FolderKanban,
    label: "Projets",
    desc: "Organisez vos créations par projet, retrouvez tout au même endroit.",
  },
  {
    icon: History,
    label: "Historique",
    desc: "Chaque génération est conservée : revenez en arrière, comparez, régénérez.",
  },
  {
    icon: Star,
    label: "Favoris",
    desc: "Épinglez vos meilleures créations pour les retrouver instantanément.",
  },
  {
    icon: Bell,
    label: "Notifications",
    desc: "Suivez l'avancement de vos générations sans quitter votre travail.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-radial-glow px-6 pb-16 pt-32 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Tout un studio créatif, <span className="text-gradient-brand">propulsé par l&apos;IA</span>
          </h1>
          <p className="mt-6 text-base text-text-secondary sm:text-lg">
            Cinq outils de génération et une plateforme pensée pour organiser, retrouver et
            itérer sur vos créations, sans jamais changer d&apos;onglet.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Les outils IA
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card key={tool.label} className="p-6">
                  <CardContent className="flex flex-col items-start gap-4 p-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-gradient-brand">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-text-primary">{tool.label}</p>
                      <p className="mt-1.5 text-sm text-text-secondary">{tool.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            La plateforme
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {platformFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.label} className="p-6">
                  <CardContent className="flex flex-col items-start gap-3 p-0">
                    <Icon className="h-6 w-6 text-brand-purple" strokeWidth={1.75} />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{feature.label}</p>
                      <p className="mt-1 text-xs text-text-muted">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Prêt à créer avec RYNVA ?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-text-secondary">
          Créez votre compte gratuitement et lancez votre première génération en quelques secondes.
        </p>
        <Link href="/register" className="mt-8 inline-block">
          <Button size="lg">Commencer gratuitement</Button>
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
