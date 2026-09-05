"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Illustrative showcase cards — RYNVA has no public generation gallery yet,
// so these are curated stock photos standing in for real renders. Swap
// `src` for actual generation thumbnails once a public gallery exists.
const showcase = [
  { title: "Portrait cinématique", src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80&auto=format&fit=crop" },
  { title: "Portrait éditorial", src: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&q=80&auto=format&fit=crop" },
  { title: "Scène de vie", src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&q=80&auto=format&fit=crop" },
  { title: "Packshot produit", src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80&auto=format&fit=crop" },
  { title: "Design graphique", src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80&auto=format&fit=crop" },
  { title: "Art conceptuel", src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80&auto=format&fit=crop" },
  { title: "Portrait sportif", src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&q=80&auto=format&fit=crop" },
  { title: "Scène nocturne", src: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=500&q=80&auto=format&fit=crop" },
  { title: "Paysage épique", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80&auto=format&fit=crop" },
];

// Two rows receding toward a shared vanishing point at the centre — cards
// near the middle are pushed back in Z (smaller, via the parent's
// perspective) and rotated outward, cards at the edges sit closest to the
// viewer, full size. Mirrors left/right around the centre index.
const ROTATE_STEP = 7;
const Z_STEP = 46;

function tunnelTransform(index: number, total: number) {
  const center = (total - 1) / 2;
  const offset = index - center;
  const absOffset = Math.abs(offset);
  return {
    rotateY: -offset * ROTATE_STEP,
    z: -(center - absOffset) * Z_STEP,
  };
}

function TunnelCard({ item, index, cycleLength }: { item: (typeof showcase)[number]; index: number; cycleLength: number }) {
  const { rotateY, z } = tunnelTransform(index % cycleLength, cycleLength);
  return (
    <div
      style={{ transform: `rotateY(${rotateY}deg) translateZ(${z}px)` }}
      className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-[0_16px_30px_-16px_rgba(20,20,18,0.4)] sm:h-52 sm:w-36"
    >
      <Image src={item.src} alt={item.title} fill sizes="144px" className="object-cover" />
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
    <section className="relative overflow-hidden bg-cream pb-24 pt-40">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        className="relative mx-auto flex max-w-4xl flex-col items-center px-6 text-center"
      >
        {/* <motion.span
          variants={fadeUp}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-xs font-medium tracking-wide text-ink-muted"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Créez, éditez, innovez avec l&apos;IA
        </motion.span> */}

        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl font-medium leading-[0.98] tracking-tight text-ink sm:text-6xl md:text-7xl"
        >
          Générez des visuels.
          <br />
          Pensés <span className="font-display-serif italic text-ink">pour vos idées</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-xl text-base text-ink-muted sm:text-lg"
        >
          RYNVA réunit l&apos;image, la vidéo, le design et l&apos;audio générés par IA
          dans un seul studio créatif pensé pour aller de l&apos;idée au rendu final
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
              className="gap-1.5 rounded-full bg-ink font-semibold text-white transition-transform hover:scale-[1.03] hover:brightness-110 py-2"
            >
              Commencer gratuitement
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/#fonctionnalites">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full border-ink/15 bg-white font-semibold text-ink transition-transform hover:scale-[1.03] hover:border-ink/30 py-2"
            >
              Découvrir RYNVA
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* generation showcase — 3D tunnel receding toward the centre, scrolling continuously */}
      <div
        className="relative mt-24 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
        style={{ perspective: "1200px" }}
      >
        <div
          className="flex w-max items-end gap-3 px-4 pb-6 animate-marquee hover:[animation-play-state:paused]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {row.map((item, i) => (
            <TunnelCard key={`${item.title}-${i}`} item={item} index={i} cycleLength={showcase.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
