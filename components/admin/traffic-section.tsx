import type { VisitStats } from "@/lib/visits/stats";
import { NoTrackToggle } from "@/components/admin/no-track-toggle";

const numberFormatter = new Intl.NumberFormat("fr-FR");
const dayFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
        {numberFormatter.format(value)}
      </p>
    </div>
  );
}

/**
 * "Trafic du site" — visits per day (bar chart, last 14 days, zero-filled)
 * and a top-countries ranking over the trailing 30 days. Single-hue
 * (zinc-900/white) bars throughout: this is a magnitude story, not an
 * identity one, so sequential monochrome is the right color job (see the
 * dataviz skill's color-formula) and it matches the rest of /admin, which
 * has no colored charts elsewhere.
 */
export function TrafficSection({
  stats,
  noTrackEnabled,
}: {
  stats: VisitStats;
  noTrackEnabled: boolean;
}) {
  const maxDay = Math.max(1, ...stats.byDay.map((d) => d.count));
  const maxCountry = Math.max(1, ...stats.byCountry.map((c) => c.count));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Trafic du site</h2>
        <NoTrackToggle initialEnabled={noTrackEnabled} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Aujourd'hui" value={stats.today} />
        <StatTile label="7 derniers jours" value={stats.last7Days} />
        <StatTile label="30 derniers jours" value={stats.last30Days} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Visites par jour
          </p>
          {stats.byDay.every((d) => d.count === 0) ? (
            <p className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
              Aucune visite enregistrée sur cette période.
            </p>
          ) : (
            <div className="flex h-28 items-end gap-1.5">
              {stats.byDay.map((d) => {
                const heightPct = d.count === 0 ? 0 : Math.max(6, Math.round((d.count / maxDay) * 100));
                return (
                  <div
                    key={d.date}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                    title={`${dayFormatter.format(new Date(d.date))} : ${d.count} visite${d.count > 1 ? "s" : ""}`}
                  >
                    <div
                      className="w-full rounded-t bg-zinc-900 dark:bg-white"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-600">
                      {dayFormatter.format(new Date(d.date)).slice(0, 2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Par pays (30j)
          </p>
          {stats.byCountry.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-600">Aucune donnée pour l&rsquo;instant.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {stats.byCountry.map((c) => (
                <div key={c.country} className="flex items-center gap-2.5">
                  <span className="w-8 shrink-0 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {c.country}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-zinc-900 dark:bg-white"
                      style={{ width: `${Math.round((c.count / maxCountry) * 100)}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs text-zinc-500">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
