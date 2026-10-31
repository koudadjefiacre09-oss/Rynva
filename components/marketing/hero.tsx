"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Real RYNVA generations supplied by the owner, ordered so the text-heavy
// posters (where AI-rendered lettering is least clean) sit at the edges of
// the fan and the cleanest product shots land in the middle.
const showcase = [
  { title: "Affiche de Noël", src: "/hero/noel-promo.jpg" },
  { title: "Affiche menu du jour", src: "/hero/menu-affiche.jpg" },
  { title: "Collection de pulls", src: "/hero/pulls-cintres.jpg" },
  { title: "Packshot parfum", src: "/hero/parfum-davis.jpg" },
  { title: "Flat lay de pulls", src: "/hero/pulls-flatlay.jpg" },
  { title: "Packshot pot de miel", src: "/hero/pot-clairy.jpg" },
  { title: "Pulls de fêtes", src: "/hero/pulls-noeuds.jpg" },
  { title: "Photo menu du jour", src: "/hero/menu-photo.jpg" },
];

// Fan geometry per breakpoint. Cards start stacked at the centre, then
// spread horizontally, rotate outward and drop along a shallow arc.
type FanLayout = { cardW: number; cardH: number; stepX: number; stepRot: number; arc: number };

const LAYOUTS: Record<"sm" | "md" | "lg", FanLayout> = {
  sm: { cardW: 88, cardH: 112, stepX: 31, stepRot: 5, arc: 3 },
  md: { cardW: 128, cardH: 162, stepX: 70, stepRot: 6, arc: 5 },
  lg: { cardW: 156, cardH: 198, stepX: 104, stepRot: 6, arc: 6 },
};

function useFanLayout() {
  const [layout, setLayout] = useState<FanLayout | null>(null);
  useEffect(() => {
    const pick = () =>
      setLayout(
        window.innerWidth < 640 ? LAYOUTS.sm : window.innerWidth < 1024 ? LAYOUTS.md : LAYOUTS.lg
      );
    pick();
    window.addEventListener("resize", pick);
    return () => window.removeEventListener("resize", pick);
  }, []);
  return layout;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const TITLE_LINE_1 = ["Image,", "vidéo,", "design,", "audio."];
const TITLE_LINE_2 = ["Un", "seul", "studio"];
const TITLE_ACCENT = ["propulsé", "par", "l'IA"];
const WORD_STAGGER = 0.08;
// Everything after the headline and the card fan is timed off this.
const FAN_DONE = 1.9;

function Word({ children, index, accent }: { children: string; index: number; accent?: boolean }) {
  return (
    <motion.span
      initial={{ opacity: 0.12, filter: "blur(8px)", y: 8 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 + index * WORD_STAGGER, ease: EASE }}
      className={`inline-block ${accent ? "font-display-serif italic" : ""}`}
    >
      {children}
    </motion.span>
  );
}

function CursorTag({
  label,
  color,
  className,
  delay,
  flip,
}: {
  label: string;
  color: string;
  className: string;
  delay: number;
  flip?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
      className={`pointer-events-none absolute z-30 hidden sm:block ${className}`}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: delay + 0.4 }}
        className={`flex items-start gap-0.5 ${flip ? "flex-row-reverse" : ""}`}
      >
        <MousePointer2
          className={`h-4 w-4 ${flip ? "-scale-x-100" : ""}`}
          style={{ color, fill: color }}
        />
        <span
          className="mt-3 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {label}
        </span>
      </motion.div>
    </motion.div>
  );
}

function CardFan() {
  const layout = useFanLayout();
  const reduceMotion = useReducedMotion();
  const center = (showcase.length - 1) / 2;

  return (
    // Height is reserved per breakpoint so nothing jumps while the layout
    // is measured client-side.
    <div className="relative mx-auto mt-14 h-[170px] w-full max-w-5xl sm:h-[230px] lg:h-[280px]">
      {layout &&
        showcase.map((item, i) => {
          const offset = i - center;
          const fanned = {
            x: offset * layout.stepX,
            y: offset * offset * layout.arc,
            rotate: offset * layout.stepRot,
            opacity: 1,
          };
          // Small alternating tilt while stacked, like a loose deck.
          const stackRotate = (i % 2 === 0 ? -1 : 1) * (3 + (i % 3) * 2);

          return (
            <motion.div
              key={item.src}
              initial={reduceMotion ? fanned : { x: 0, y: 140, rotate: stackRotate * 2, opacity: 0 }}
              animate={
                reduceMotion
                  ? fanned
                  : {
                      x: [0, 0, fanned.x],
                      y: [140, 0, fanned.y],
                      rotate: [stackRotate * 2, stackRotate, fanned.rotate],
                      opacity: [0, 1, 1],
                    }
              }
              transition={{ duration: 1.6, delay: 0.25 + i * 0.04, times: [0, 0.45, 1], ease: EASE }}
              style={{
                width: layout.cardW,
                height: layout.cardH,
                marginLeft: -layout.cardW / 2,
                zIndex: i,
              }}
              className="group absolute left-1/2 top-0 hover:!z-40"
            >
              <div className="relative h-full w-full overflow-hidden rounded-2xl border-[3px] border-white bg-white shadow-[0_18px_36px_-18px_rgba(20,20,18,0.45)] transition-transform duration-300 ease-out group-hover:-translate-y-4 group-hover:scale-[1.06]">
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 156px, (min-width: 640px) 128px, 92px"
                  className="object-cover"
                  priority={Math.abs(offset) < 2}
                />
              </div>
            </motion.div>
          );
        })}

      <CursorTag label="Image" color="#3D88FF" className="left-[6%] top-[-14%] lg:left-[12%]" delay={FAN_DONE} />
      <CursorTag
        label="Vidéo"
        color="#22A06B"
        className="right-[6%] top-[-6%] lg:right-[12%]"
        delay={FAN_DONE + 0.15}
        flip
      />
    </div>
  );
}

// Soft marble-like streaks behind the hero, echoing the reference's
// light grey textured backdrop without competing with the cards.
function Backdrop() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="hero-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>
      <g filter="url(#hero-blur)" stroke="#FFFFFF" fill="none" strokeLinecap="round" opacity="0.9">
        <path d="M-100 220 C 300 80, 620 360, 980 200 S 1500 120, 1600 260" strokeWidth="70" />
        <path d="M-120 560 C 260 420, 560 700, 900 540 S 1400 420, 1580 600" strokeWidth="90" />
        <path d="M200 900 C 420 760, 760 860, 1100 740 S 1460 820, 1560 760" strokeWidth="60" />
      </g>
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  let wordIndex = 0;

  return (
    <section className="relative overflow-hidden bg-[#F2F2EF] pb-24 pt-32 sm:pt-36">
      <Backdrop />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 text-center">
        {/* Words are separate animated spans laid out with flex gaps, so a
            screen reader would read them run together — the label carries
            the real sentence and the visual spans are hidden from AT. */}
        <h1
          aria-label="Image, vidéo, design, audio. Un seul studio propulsé par l'IA"
          className="text-[2.6rem] font-medium leading-[1.02] tracking-tight text-ink sm:text-6xl md:text-7xl"
        >
          <span aria-hidden className="flex flex-wrap justify-center gap-x-[0.25em]">
            {TITLE_LINE_1.map((w) => (
              <Word key={w} index={wordIndex++}>
                {w}
              </Word>
            ))}
          </span>
          <span aria-hidden className="flex flex-wrap justify-center gap-x-[0.25em]">
            {TITLE_LINE_2.map((w) => (
              <Word key={w} index={wordIndex++}>
                {w}
              </Word>
            ))}
            {TITLE_ACCENT.map((w) => (
              <Word key={w} index={wordIndex++} accent>
                {w}
              </Word>
            ))}
          </span>
        </h1>
      </div>

      <CardFan />

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: FAN_DONE - 0.3 } } }}
        className="relative mx-auto mt-10 flex max-w-xl flex-col items-center px-6 text-center"
      >
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-base text-ink-muted sm:text-lg"
        >
          RYNVA réunit l&apos;image, la vidéo, le design et l&apos;audio générés par IA dans un
          seul studio créatif, de l&apos;idée au rendu final sans changer d&apos;outil.
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link href="/register">
            <Button
              size="lg"
              className="gap-1.5 rounded-full bg-ink py-2 font-semibold text-white transition-transform hover:scale-[1.03] hover:brightness-125"
            >
              Commencer gratuitement
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link
            href="/#fonctionnalites"
            className="px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-60"
          >
            Découvrir RYNVA
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
