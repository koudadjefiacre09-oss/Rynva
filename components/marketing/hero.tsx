"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Image as ImageIcon, Video, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Illustrative showcase cards — RYNVA has no public generation gallery yet,
// so these are stylised placeholders (gradient + type icon), not real
// renders. Swap for actual thumbnails once a curated gallery exists.
const showcase = [
  { type: "image", title: "Portrait cinématique", gradient: "from-blue-600/40 via-sky-400/10 to-transparent" },
  { type: "video", title: "Clip produit 4K", gradient: "from-cyan-500/30 via-blue-500/10 to-transparent" },
  { type: "image", title: "Scène futuriste", gradient: "from-indigo-600/30 via-blue-500/10 to-transparent" },
  { type: "video", title: "Teaser cinéma", gradient: "from-blue-600/40 via-violet-500/10 to-transparent" },
  { type: "image", title: "Packshot studio", gradient: "from-sky-500/25 via-blue-500/10 to-transparent" },
  { type: "image", title: "Portrait éditorial", gradient: "from-blue-600/40 via-cyan-400/10 to-transparent" },
  { type: "video", title: "Motion design", gradient: "from-indigo-500/30 via-blue-500/10 to-transparent" },
  { type: "image", title: "Concept art", gradient: "from-blue-600/40 via-sky-500/10 to-transparent" },
];

function ShowcaseCard({ item }: { item: (typeof showcase)[number] }) {
  const Icon = item.type === "video" ? Video : ImageIcon;
  return (
    <div className="group relative h-56 w-40 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gray-950 transition-transform duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 sm:h-64 sm:w-44">
      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
      {/* thin diagonal light reflection */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="h-7 w-7 text-white/50 transition-colors duration-300 group-hover:text-blue-300" strokeWidth={1.5} />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8">
        <p className="text-xs font-medium text-white/90">{item.title}</p>
        <p className="text-[11px] text-gray-500">{item.type === "video" ? "Vidéo IA" : "Image IA"}</p>
      </div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  const row = [...showcase, ...showcase];

  return (
    <section className="relative overflow-hidden bg-black pb-20 pt-40">
      {/* radial blue glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(ellipse_at_top,_theme(colors.blue.600/0.22),_transparent_60%)]" />
      <div className="pointer-events-none absolute -left-32 top-64 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-sky-500/10 blur-[100px]" />

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        className="relative mx-auto flex max-w-4xl flex-col items-center px-6 text-center"
      >
        <motion.span
          variants={fadeUp}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-950/80 px-3.5 py-1.5 text-xs font-medium tracking-wide text-gray-400"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          CREATE • EDIT • INNOVATE
        </motion.span>

        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl md:text-7xl"
        >
          Générez des visuels{" "}
          <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
            extraordinaires
          </span>{" "}
          avec l&apos;IA
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-xl text-base text-gray-400 sm:text-lg"
        >
          RYNVA réunit l&apos;image, la vidéo, le design et l&apos;audio générés par IA
          dans un seul studio créatif — pensé pour aller de l&apos;idée au rendu final
          sans changer d&apos;outil.
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col gap-3 sm:flex-row"
        >
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-blue text-white shadow-[0_0_40px_-10px_rgba(37,99,235,0.6)] transition-transform hover:scale-[1.03] hover:brightness-110"
            >
              Commencer gratuitement
            </Button>
          </Link>
          <Link href="/#fonctionnalites">
            <Button
              size="lg"
              variant="secondary"
              className="border-gray-800 bg-gray-950 text-white transition-transform hover:scale-[1.03] hover:border-blue-500/50"
            >
              Découvrir RYNVA
            </Button>
          </Link>
        </motion.div>
      </motion.div>

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
