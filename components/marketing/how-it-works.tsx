"use client";

import { PenLine, Wand2, Download } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: PenLine,
    step: "01",
    title: "Décrivez votre idée",
    desc: "Un prompt texte suffit pour démarrer, quel que soit l'outil — image, vidéo, design ou audio.",
  },
  {
    icon: Wand2,
    step: "02",
    title: "Générez et itérez",
    desc: "Ajustez le format, régénérez, comparez les résultats côte à côte dans votre historique.",
  },
  {
    icon: Download,
    step: "03",
    title: "Exportez ou continuez",
    desc: "Récupérez votre création en haute qualité, ou enchaînez avec un autre outil du studio.",
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="relative scroll-mt-24 border-t border-gray-800 bg-gray-950/40 px-6 py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_center,_theme(colors.blue.600/0.1),_transparent_65%)]" />

      <div className="relative mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Comment ça marche</h2>
          <p className="mt-3 text-gray-400">Trois étapes entre votre idée et votre création finale.</p>
        </motion.div>

        <div className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* connecting line, desktop only */}
          <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent sm:block" />

          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.5, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex flex-col items-center text-center sm:items-start sm:text-left"
              >
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-800 bg-black shadow-glow-blue transition-transform duration-300 group-hover:-translate-y-1 group-hover:border-blue-500/50">
                  <Icon className="h-6 w-6 text-blue-400" strokeWidth={1.75} />
                </div>
                <span className="mt-5 text-sm font-semibold text-blue-400">{s.step}</span>
                <p className="mt-1.5 text-base font-medium text-white">{s.title}</p>
                <p className="mt-2 text-sm text-gray-400">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
