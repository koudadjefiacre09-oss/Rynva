"use client";

import Image from "next/image";
import { motion } from "framer-motion";

// Illustrative examples — stock photos standing in for AI-generated output
// until RYNVA has a real public gallery to pull from. Swap `src` for actual
// generation thumbnails once available.
const examples = [
  {
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80&auto=format&fit=crop",
    title: "Portrait cinématique",
    tag: "AI Image",
    span: "sm:row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop",
    title: "Paysage épique",
    tag: "AI Image",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80&auto=format&fit=crop",
    title: "Scène futuriste",
    tag: "AI Vidéo",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80&auto=format&fit=crop",
    title: "Design graphique",
    tag: "AI Design",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop",
    title: "Packshot produit",
    tag: "AI Photo",
    span: "sm:row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80&auto=format&fit=crop",
    title: "Art conceptuel",
    tag: "AI Image",
    span: "",
  },
];

export function ExamplesGallery() {
  return (
    <section id="exemples" className="relative scroll-mt-24 bg-black px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ce que vous pouvez créer
          </h2>
          <p className="mt-3 text-gray-400">
            Un aperçu du type de rendu que produisent les outils RYNVA.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-2 grid-rows-[repeat(4,14rem)] gap-4 sm:grid-cols-3 sm:grid-rows-[repeat(2,16rem)]">
          {examples.map((ex, i) => (
            <motion.div
              key={ex.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative overflow-hidden rounded-2xl border border-gray-800 ${ex.span}`}
            >
              <Image
                src={ex.src}
                alt={ex.title}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-white">{ex.title}</p>
                  <p className="text-xs text-blue-300">{ex.tag}</p>
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/0 transition-all duration-300 group-hover:ring-blue-500/40" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
