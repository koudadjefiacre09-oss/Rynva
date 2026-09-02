import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ACTION_LABEL, type ActivityAction } from "@/lib/activity/log";

export const metadata: Metadata = { title: "Historique" };

interface ActivityRow {
  id: string;
  action_type: string;
  status: string; // "Réussi" | "Échoué"
  tokens_used: number;
  error_message: string | null;
  created_at: string;
}

export default async function HistoryPage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Relies on the "select own" policy from migration 0009 — without it this
  // silently returns nothing (RLS denies, no error), which is exactly why
  // that migration exists: this table has zero policies otherwise.
  const { data } = await supabase
    .from("activity_logs")
    .select("id, action_type, status, tokens_used, error_message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const items = (data ?? []) as ActivityRow[];
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Historique
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Toutes vos tentatives de génération, réussies ou échouées.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 py-16 text-center dark:border-zinc-800/60 dark:bg-zinc-900/60">
          <History className="mb-1 h-7 w-7 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            Aucune activité pour le moment
          </p>
          <p className="max-w-sm text-xs text-zinc-500">
            Vos générations, réussies comme échouées, apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Action
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Statut
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Tokens
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                  <td className="px-4 py-3 text-zinc-900 dark:text-white">
                    {ACTION_LABEL[item.action_type as ActivityAction] ?? item.action_type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      title={item.status === "Échoué" ? item.error_message ?? undefined : undefined}
                      className={
                        item.status === "Réussi"
                          ? "inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "inline-flex w-fit items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400"
                      }
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{item.tokens_used}</td>
                  <td className="px-4 py-3 text-right text-xs text-zinc-400 dark:text-zinc-500">
                    {dateFormatter.format(new Date(item.created_at))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
