// One accent color per nav destination, keyed by href — shared between the
// sidebar (components/layout/sidebar.tsx) and the dashboard's tool shortcuts
// (app/(app)/dashboard/page.tsx) so the same tool always reads the same
// color in both places. Light chip background + dark-mode equivalent.
export const NAV_ACCENT: Record<string, string> = {
  "/dashboard": "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  "/ai/image": "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  "/ai/video": "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  "/ai/photo": "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  "/ai/design": "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  "/ai/audio": "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  "/ai/scene": "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
  "/ai/chat": "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  "/characters": "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400",
  "/projects": "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  "/history": "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
  "/favorites": "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400",
  "/admin": "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

export const DEFAULT_NAV_ACCENT = "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
