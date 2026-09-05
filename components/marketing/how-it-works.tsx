"use client";

import { Compass, Wand2, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Compass,
    badge: "01",
    badgeColor: "bg-emerald-500",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Décrivez votre idée",
    desc: "Un prompt texte suffit pour démarrer, quel que soit l'outil.",
    // position as % of the staging area, bottom-left to top-right
    pos: { left: "0%", bottom: "0%" },
  },
  {
    icon: Wand2,
    badge: "02",
    badgeColor: "bg-blue-500",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Générez et itérez",
    desc: "Ajustez, régénérez, comparez les résultats dans votre historique.",
    pos: { left: "30%", bottom: "34%" },
  },
  {
    icon: Trophy,
    badge: "03",
    badgeColor: "bg-ink",
    iconBg: "bg-cream-dark",
    iconColor: "text-ink",
    title: "Exportez ou continuez",
    desc: "Récupérez votre création, ou enchaînez avec un autre outil.",
    pos: { left: "62%", bottom: "68%" },
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="relative scroll-mt-24 border-t border-ink/10 bg-cream px-6 py-24">
      <div className="relative mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">
            Comment <span className="font-display-serif italic">ça marche</span>
          </h2>
          <p className="mt-3 text-ink-muted">Trois étapes entre votre idée et votre création finale.</p>
        </motion.div>

        {/* Desktop: staggered diagonal cards with a connecting curve */}
        <div className="relative mt-20 hidden h-[420px] lg:block">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M 14 92 C 24 70, 30 58, 40 50 S 58 32, 74 16"
              fill="none"
              stroke="#3D88FF"
              strokeWidth="0.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>

          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.badge}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ left: s.pos.left, bottom: s.pos.bottom }}
                className="group absolute flex w-64 items-start gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_16px_36px_-18px_rgba(20,20,18,0.3)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}>
                  <Icon className={`h-5 w-5 ${s.iconColor}`} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{s.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{s.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile / tablet: simple vertical stack */}
        <div className="mt-16 flex flex-col gap-4 lg:hidden">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.badge}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_12px_30px_-18px_rgba(20,20,18,0.2)]"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}>
                  <Icon className={`h-5 w-5 ${s.iconColor}`} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink">{s.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{s.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
