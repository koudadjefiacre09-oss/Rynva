"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const tools = [
  {
    icon: "/icones/image.png",
    label: "Image",
    href: "/ai/image",
    desc: "Générez des visuels à partir d'un simple prompt texte.",
    pos: { x: 16, y: 18 },
  },
  {
    icon: "/icones/video.png",
    label: "Vidéo",
    href: "/ai/video",
    desc: "Transformez une idée en clip vidéo court, prêt à partager.",
    pos: { x: 84, y: 18 },
  },
  {
    icon: "/icones/photo.png",
    label: "Photo",
    href: "/ai/photo",
    desc: "Retouchez et détourez vos photos instantanément.",
    pos: { x: 16, y: 82 },
  },
  {
    icon: "/icones/design.png",
    label: "Design",
    href: "/ai/design",
    desc: "Créez posts, stories et bannières au bon format.",
    pos: { x: 8, y: 50 },
  },
  {
    icon: "/icones/audio.png",
    label: "Audio",
    href: "/ai/audio",
    desc: "Générez voix off, musiques et effets sonores.",
    pos: { x: 92, y: 50 },
  },
  {
    icon: "/icones/chat.jpg",
    label: "Chat",
    href: "/ai/chat",
    desc: "Un assistant créatif pour affiner vos idées.",
    pos: { x: 84, y: 82 },
  },
];

const CENTER = { x: 50, y: 50 };
// Lines start a bit away from the exact center (hub edge) so they tuck
// behind the hub instead of visibly crossing through one another.
const START_RADIUS = 11;

function connectorPath(tx: number, ty: number) {
  const dx = tx - CENTER.x;
  const dy = ty - CENTER.y;
  const len = Math.hypot(dx, dy) || 1;
  const sx = CENTER.x + (dx / len) * START_RADIUS;
  const sy = CENTER.y + (dy / len) * START_RADIUS;
  const midX = sx + (tx - sx) * 0.55;
  return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
}

export function ToolsTeaser() {
  return (
    <section id="fonctionnalites" className="relative scroll-mt-24 bg-cream px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">
            Un studio, <span className="font-display-serif italic">six</span> outils IA
          </h2>
          <p className="mt-3 text-ink-muted">
            Survolez un outil pour voir ce qu&apos;il fait, du premier brouillon au rendu final.
          </p>
        </motion.div>

        {/* Desktop: hub-and-spoke diagram */}
        <div className="relative mx-auto mt-16 hidden h-[380px] max-w-3xl lg:block">
          {/* decorative concentric rings behind the hub */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/10" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/[0.06]" />

          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {tools.map((tool, i) => (
              <motion.path
                key={tool.label}
                d={connectorPath(tool.pos.x, tool.pos.y)}
                fill="none"
                stroke="currentColor"
                className="text-ink/15"
                strokeWidth="0.4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 1, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </svg>

          {/* central hub — positioning lives on this static wrapper, not the
              motion.div below: framer-motion writes its own `transform` for
              the scale animation, which clobbers a Tailwind
              -translate-x-1/2 -translate-y-1/2 on the same element and
              throws the centering off. */}
          <div className="absolute left-1/2 top-1/2 z-10 h-14 w-32 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full rounded-2xl bg-ink shadow-[0_16px_40px_-16px_rgba(20,20,18,0.5)]"
            >
              <div className="relative h-full w-full p-2">
                <Image src="/logo-full.png" alt="RYNVA" fill sizes="128px" className="object-contain" />
              </div>
            </motion.div>
          </div>

          {/* tool badges, each with a hover card describing the tool */}
          {tools.map((tool, i) => (
            <motion.div
              key={tool.label}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{ left: `${tool.pos.x}%`, top: `${tool.pos.y}%` }}
              className="group absolute z-20 -translate-x-1/2 -translate-y-1/2"
            >
              <Link href={tool.href} className="flex flex-col items-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-ink/10 bg-white shadow-[0_10px_24px_-14px_rgba(20,20,18,0.3)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_-14px_rgba(20,20,18,0.35)]">
                  <Image
                    src={tool.icon}
                    alt={`Outil ${tool.label}`}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-md object-cover"
                  />
                </div>
                <p className="text-xs font-medium text-ink-muted transition-colors group-hover:text-ink">{tool.label}</p>
              </Link>

              {/* hover card — appears above the badge */}
              <div
                className={`pointer-events-none absolute bottom-full left-1/2 mb-3 w-52 -translate-x-1/2 translate-y-1 rounded-2xl border border-ink/10 bg-white p-4 text-left opacity-0 shadow-[0_20px_40px_-16px_rgba(20,20,18,0.35)] transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 ${
                  tool.pos.y < 40 ? "!bottom-auto !top-full !mb-0 !mt-3" : ""
                }`}
              >
                <p className="text-sm font-medium text-ink">Générez avec {tool.label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{tool.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile / tablet: plain grid, no diagram */}
        <div className="mt-12 grid grid-cols-3 gap-4 lg:hidden">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={tool.href}
                className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-white px-3 py-6 text-center transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-dark">
                  <Image
                    src={tool.icon}
                    alt={`Outil ${tool.label}`}
                    width={26}
                    height={26}
                    className="h-6 w-6 rounded-md object-cover"
                  />
                </div>
                <p className="text-xs font-medium text-ink">{tool.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
