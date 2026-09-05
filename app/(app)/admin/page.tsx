import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { initialsOf } from "@/components/layout/user-menu";
import { TrafficSection } from "@/components/admin/traffic-section";
import { ACTION_LABEL, type ActivityAction } from "@/lib/activity/log";
import { getVisitStats } from "@/lib/visits/stats";
import { isNoTrackEnabled } from "@/lib/visits/no-track";

export const metadata: Metadata = { title: "Admin" };

interface ActivityRow {
  user_id: string;
  action_type: string;
  status: string; // "Réussi" | "Échoué" — written as-is by lib/activity/log.ts
  tokens_used: number;
  error_message: string | null;
  created_at: string;
}

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  country: string | null;
  banned: boolean;
  lastAction: ActivityRow | null;
  totalActions: number;
  totalTokensUsed: number;
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Administration
        </h1>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 py-16 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <AlertTriangle className="mb-1 h-7 w-7 text-amber-500" strokeWidth={1.5} />
        <p className="text-sm font-medium text-zinc-900 dark:text-white">{title}</p>
        <p className="max-w-md text-xs text-zinc-500">{message}</p>
      </div>
    </div>
  );
}

export default async function AdminPage() {
  await requireAdmin();

  if (!isAdminConfigured) {
    return (
      <EmptyState
        title="Clé service role manquante"
        message="Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local (Supabase → Project Settings → API → service_role) puis relancez le serveur. L'espace admin lit tous les comptes avec cette clé, pas la clé publique."
      />
    );
  }

  const supabaseAdmin = createAdminClient();

  const [
    { data: usersResult, error: usersError },
    { data: profiles },
    { data: activity },
    visitStats,
    noTrackEnabled,
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ perPage: 200 }),
    supabaseAdmin.from("profiles").select("id, country"),
    supabaseAdmin
      .from("activity_logs")
      .select("user_id, action_type, status, tokens_used, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    getVisitStats(14),
    isNoTrackEnabled(),
  ]);

  if (usersError || !usersResult) {
    return (
      <EmptyState
        title="Impossible de charger les comptes"
        message={usersError?.message ?? "Erreur inconnue."}
      />
    );
  }

  const countryById = new Map((profiles ?? []).map((p) => [p.id as string, p.country as string | null]));

  const activityByUser = new Map<string, ActivityRow[]>();
  for (const row of (activity ?? []) as ActivityRow[]) {
    const list = activityByUser.get(row.user_id) ?? [];
    list.push(row);
    activityByUser.set(row.user_id, list);
  }

  const rows: AdminUserRow[] = usersResult.users
    .map((u) => {
      const userActivity = activityByUser.get(u.id) ?? []; // already sorted desc by the query
      return {
        id: u.id,
        name: (u.user_metadata?.full_name as string | undefined) || u.email || "Utilisateur",
        email: u.email ?? "Non renseigné",
        createdAt: u.created_at,
        country: countryById.get(u.id) ?? null,
        banned: Boolean(u.banned_until && new Date(u.banned_until) > new Date()),
        lastAction: userActivity[0] ?? null,
        totalActions: userActivity.length,
        totalTokensUsed: userActivity.reduce((sum, a) => sum + (a.tokens_used ?? 0), 0),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

  return (
    <div className="mx-auto flex max-w-[100rem] flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Administration
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {rows.length} compte{rows.length > 1 ? "s" : ""}, activité et consommation par utilisateur.
        </p>
      </div>

      <TrafficSection stats={visitStats} noTrackEnabled={noTrackEnabled} />

      <div className="thin-scrollbar max-h-[640px] overflow-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="sticky top-0 bg-white px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
                Utilisateur
              </th>
              <th className="sticky top-0 bg-white px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
                Pays
              </th>
              <th className="sticky top-0 bg-white px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
                Dernière activité
              </th>
              <th className="sticky top-0 bg-white px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
                Consommation
              </th>
              <th className="sticky top-0 bg-white px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40"
              >
                <td className="px-4 py-3.5 align-top">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-semibold text-white">
                      {initialsOf(row.name)}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900 dark:text-white">{row.name}</span>
                      <span className="text-xs text-zinc-500">{row.email}</span>
                      <span className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                        Inscrit le {dateFormatter.format(new Date(row.createdAt))}
                      </span>
                      {row.banned && (
                        <span className="mt-1 inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                          Suspendu
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top text-zinc-700 dark:text-zinc-300">
                  {row.country ?? <span className="text-zinc-400 dark:text-zinc-600">Inconnu</span>}
                </td>
                <td className="px-4 py-3.5 align-top">
                  {row.lastAction ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {ACTION_LABEL[row.lastAction.action_type as ActivityAction] ??
                          row.lastAction.action_type}
                      </span>
                      <span
                        title={row.lastAction.status === "Échoué" ? row.lastAction.error_message ?? undefined : undefined}
                        className={
                          row.lastAction.status === "Réussi"
                            ? "inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : "inline-flex w-fit items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400"
                        }
                      >
                        {row.lastAction.status}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-600">Aucune activité</span>
                  )}
                </td>
                <td className="px-4 py-3.5 align-top">
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {row.totalTokensUsed}
                  </span>
                  <span className="text-zinc-500"> tokens</span>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {row.totalActions} action{row.totalActions > 1 ? "s" : ""}
                  </p>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <UserRowActions userId={row.id} banned={row.banned} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
        Les tokens consommés sont un coût fixe par type d&rsquo;action (voir
        lib/activity/log.ts), pas une facturation réelle des fournisseurs IA. Chaque
        événement est bien réel et enregistré individuellement, seul son coût unitaire est
        estimé. Le pays n&rsquo;est renseigné que si l&rsquo;hébergement transmet une
        géolocalisation IP, sinon « Inconnu ».
      </p>
    </div>
  );
}
