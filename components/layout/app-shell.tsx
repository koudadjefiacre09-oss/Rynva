import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProfile, type Profile } from "@/lib/profiles/get";
import { listGenerations, type GenerationWithUrl } from "@/lib/generations/list";
import { listNotifications } from "@/lib/notifications/list";
import type { NotificationRow } from "@/lib/notifications/types";

/**
 * Shared authenticated shell: persistent sidebar + topbar around `children`.
 * Used by every section's layout (dashboard, AI tools, characters, projects...)
 * so the aside doesn't have to be re-implemented per section.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  let user: { id: string; name: string; email: string } | null = null;
  let profile: Profile | null = null;
  let recentGenerations: GenerationWithUrl[] = [];
  let notifications: NotificationRow[] = [];
  let unreadNotificationsCount = 0;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      user = {
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email || "Utilisateur",
        email: authUser.email ?? "",
      };
      profile = await getProfile(authUser.id);
      // Feeds the ⌘K command palette's "recent projects" results.
      recentGenerations = await listGenerations(authUser.id, 20);
      const notifs = await listNotifications(authUser.id);
      notifications = notifs.notifications;
      unreadNotificationsCount = notifs.unreadCount;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      <Sidebar user={user} profile={profile} isAdmin={profile?.isAdmin ?? false} />
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <Topbar
          user={user}
          profile={profile}
          recentGenerations={recentGenerations}
          notifications={notifications}
          unreadNotificationsCount={unreadNotificationsCount}
        />
        <main className="thin-scrollbar m-3 flex-1 overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-4 pb-24 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:p-6">
          {children}
        </main>
      </div>
      {user && <MobileBottomNav />}
    </div>
  );
}
