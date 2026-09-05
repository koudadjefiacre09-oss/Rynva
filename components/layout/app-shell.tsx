import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
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
    <div className="flex h-screen overflow-hidden bg-white dark:bg-black">
      <Sidebar isAdmin={profile?.isAdmin ?? false} />
      <div className="flex h-full flex-1 flex-col overflow-y-auto">
        <Topbar
          user={user}
          profile={profile}
          recentGenerations={recentGenerations}
          notifications={notifications}
          unreadNotificationsCount={unreadNotificationsCount}
        />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
