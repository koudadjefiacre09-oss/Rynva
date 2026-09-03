"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";

const stats = [
  { value: 500, suffix: "K+", label: "Visuels générés" },
  { value: 99, suffix: "%", label: "Satisfaction utilisateurs" },
  { value: 6, suffix: "s", label: "Temps de génération moyen" },
  { value: 6, suffix: "", label: "Outils IA réunis" },
];

function StatValue({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <p
      ref={ref}
      className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl"
    >
      {display}
      {suffix}
    </p>
  );
}

export function StatsSection() {
  return (
    <section className="border-y border-gray-800 bg-black">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-gray-800 sm:grid-cols-4 sm:divide-y-0">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-1.5 px-6 py-12 text-center"
          >
            <StatValue value={stat.value} suffix={stat.suffix} />
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
