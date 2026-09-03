"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const tools = [
  { icon: "/icones/image.png", label: "Image", desc: "Visuels à partir d'un prompt.", href: "/ai/image" },
  { icon: "/icones/video.png", label: "Vidéo", desc: "Idées transformées en clips.", href: "/ai/video" },
  { icon: "/icones/photo.png", label: "Photo", desc: "Retouche et détourage instantanés.", href: "/ai/photo" },
  { icon: "/icones/design.png", label: "Design", desc: "Posts, stories et bannières.", href: "/ai/design" },
  { icon: "/icones/audio.png", label: "Audio", desc: "Voix off, musique, effets.", href: "/ai/audio" },
  { icon: "/icones/chat.jpg", label: "Chat", desc: "Un assistant créatif dédié.", href: "/ai/chat" },
];

export function ToolsTeaser() {
  return (
    <section id="fonctionnalites" className="relative scroll-mt-24 bg-black px-6 py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_center,_theme(colors.blue.600/0.12),_transparent_65%)]" />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Un studio, six outils IA
          </h2>
          <p className="mt-3 text-gray-400">
            Tout ce qu&apos;il faut pour créer, du premier brouillon au rendu final.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={tool.href}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-800 bg-gray-950/60 px-4 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-gray-950 hover:shadow-glow-blue"
              >
                <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-b from-gray-900 to-black shadow-[0_0_30px_-8px_rgba(37,99,235,0.4)] transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src={tool.icon}
                    alt={`Outil ${tool.label}`}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-md object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{tool.label}</p>
                  <p className="mt-1 text-xs text-gray-500">{tool.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
