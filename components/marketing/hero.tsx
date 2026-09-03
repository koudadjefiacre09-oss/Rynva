import Link from "next/link";
import { Image as ImageIcon, Video, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Illustrative showcase cards — RYNVA has no public generation gallery yet,
// so these are stylised placeholders (gradient + type icon), not real
// renders. Swap for actual thumbnails once a curated gallery exists.
const showcase = [
  { type: "image", title: "Portrait cinématique", gradient: "from-orange-600/40 via-amber-500/10 to-transparent" },
  { type: "video", title: "Clip produit 4K", gradient: "from-fuchsia-600/30 via-orange-500/10 to-transparent" },
  { type: "image", title: "Scène futuriste", gradient: "from-sky-600/30 via-orange-500/10 to-transparent" },
  { type: "video", title: "Teaser cinéma", gradient: "from-orange-600/40 via-red-500/10 to-transparent" },
  { type: "image", title: "Packshot studio", gradient: "from-emerald-600/25 via-orange-500/10 to-transparent" },
  { type: "image", title: "Portrait éditorial", gradient: "from-orange-600/40 via-amber-500/10 to-transparent" },
  { type: "video", title: "Motion design", gradient: "from-violet-600/30 via-orange-500/10 to-transparent" },
  { type: "image", title: "Concept art", gradient: "from-orange-600/40 via-rose-500/10 to-transparent" },
];

function ShowcaseCard({ item }: { item: (typeof showcase)[number] }) {
  const Icon = item.type === "video" ? Video : ImageIcon;
  return (
    <div className="group relative h-56 w-40 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 sm:h-64 sm:w-44">
      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
      {/* thin diagonal light reflection */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="h-7 w-7 text-white/50" strokeWidth={1.5} />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8">
        <p className="text-xs font-medium text-white/90">{item.title}</p>
        <p className="text-[11px] text-zinc-500">{item.type === "video" ? "Vidéo IA" : "Image IA"}</p>
      </div>
    </div>
  );
}

export function Hero() {
  const row = [...showcase, ...showcase];

  return (
    <section className="relative overflow-hidden bg-black pb-20 pt-40">
      {/* radial copper/orange glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(ellipse_at_top,_theme(colors.orange.600/0.22),_transparent_60%)]" />
      <div className="pointer-events-none absolute -left-32 top-64 h-96 w-96 rounded-full bg-orange-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-amber-500/10 blur-[100px]" />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-3.5 py-1.5 text-xs font-medium tracking-wide text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-orange-500" />
          CREATE • EDIT • INNOVATE
        </span>

        <h1 className="text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl md:text-7xl">
          Générez des visuels{" "}
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            extraordinaires
          </span>{" "}
          avec l&apos;IA
        </h1>

        <p className="mt-6 max-w-xl text-base text-zinc-400 sm:text-lg">
          RYNVA réunit l&apos;image, la vidéo, le design et l&apos;audio générés par IA
          dans un seul studio créatif — pensé pour aller de l&apos;idée au rendu final
          sans changer d&apos;outil.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-[0_0_40px_-10px_rgba(234,88,12,0.6)] hover:brightness-110"
            >
              Commencer gratuitement
            </Button>
          </Link>
          <Link href="/features">
            <Button size="lg" variant="secondary" className="border-zinc-800 bg-zinc-950 text-white hover:border-orange-600/50">
              Découvrir RYNVA
            </Button>
          </Link>
        </div>
      </div>

      {/* generation showcase carousel */}
      <div className="relative mt-16 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]">
          {row.map((item, i) => (
            <ShowcaseCard key={`${item.title}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
