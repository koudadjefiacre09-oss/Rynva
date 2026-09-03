const stats = [
  { value: "500K+", label: "Visuels générés" },
  { value: "99%", label: "Satisfaction utilisateurs" },
  { value: "6s", label: "Temps de génération moyen" },
  { value: "6", label: "Outils IA réunis" },
];

export function StatsSection() {
  return (
    <section className="border-y border-zinc-800 bg-black">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-zinc-800 sm:grid-cols-4 sm:divide-y-0">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1.5 px-6 py-12 text-center">
            <p className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              {stat.value}
            </p>
            <p className="text-sm text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
