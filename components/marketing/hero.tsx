import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-radial-glow px-6 pt-28 pb-20 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <Image src="/logo.png" alt="RYNVA" width={64} height={64} className="mb-8" />

        <span className="mb-5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium tracking-wide text-text-secondary">
          CREATE • EDIT • INNOVATE
        </span>

        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          Créez. Éditez.{" "}
          <span className="text-gradient-brand">Innovez.</span>
        </h1>

        <p className="mt-6 max-w-xl text-base text-text-secondary sm:text-lg">
          RYNVA réunit l&apos;image, la vidéo, le design et l&apos;audio générés par IA
          dans un seul studio créatif — pensé pour aller de l&apos;idée au rendu final
          sans changer d&apos;outil.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/register">
            <Button size="lg">Commencer gratuitement</Button>
          </Link>
          <Link href="/features">
            <Button size="lg" variant="secondary">
              Découvrir RYNVA
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
