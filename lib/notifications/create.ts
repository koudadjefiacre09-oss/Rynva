import { createAdminClient } from "@/lib/supabase/admin";
import type { ActivityAction } from "@/lib/activity/log";

export type NotificationType = "generation" | "profile" | "avatar" | "password" | "character";

/**
 * Records one row in `public.notifications`, read by the topbar bell (see
 * components/layout/notifications-bell.tsx). Uses the service-role client
 * for the same reason as lib/activity/log.ts: it's the only place that
 * writes this table, so no user-facing insert policy is needed (see
 * supabase/migrations/0010_notifications.sql).
 *
 * Best-effort: any failure is swallowed so it never breaks the action that
 * triggered it — logged to the server console instead.
 */
export async function createNotification(
  userId: string,
  notification: { type: NotificationType; title: string; message: string; link?: string }
) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link ?? null,
    });
    if (error) console.error("[createNotification] insert failed:", error.message);
  } catch (err) {
    console.error("[createNotification] failed:", err);
  }
}

// Generations this fires a notification for. "chat" is deliberately excluded
// — one per message would spam the bell — same reasoning as its flat cost in
// lib/activity/log.ts not really meaning much.
const GENERATION_NOUN: Partial<Record<ActivityAction, string>> = {
  image: "image",
  video: "vidéo",
  design: "design",
  audio: "audio",
  scene: "scène",
  "photo-bg-remove": "suppression de fond",
  "photo-enhance": "amélioration photo",
};

/**
 * Notifies a user that one of their generations finished (or failed).
 * Called right alongside lib/activity/log.ts's logActivity(), from every
 * app/api/ai/** route, so it shares the same ActivityAction shape.
 */
export async function notifyGeneration(
  userId: string,
  action: ActivityAction,
  status: "success" | "error"
) {
  const noun = GENERATION_NOUN[action];
  if (!noun) return;

  if (status === "success") {
    await createNotification(userId, {
      type: "generation",
      title: "Génération réussie",
      message: `Nouvelle création disponible : ${noun}.`,
      link: "/history",
    });
  } else {
    await createNotification(userId, {
      type: "generation",
      title: "Génération échouée",
      message: `La génération a échoué (${noun}). Vous pouvez réessayer.`,
      link: "/history",
    });
  }
}

export const NOTIFY = {
  profileUpdated: (userId: string) =>
    createNotification(userId, {
      type: "profile",
      title: "Profil mis à jour",
      message: "Vous avez modifié votre profil.",
      link: "/profile",
    }),
  avatarUpdated: (userId: string) =>
    createNotification(userId, {
      type: "avatar",
      title: "Photo de profil mise à jour",
      message: "Vous avez ajouté une nouvelle photo de profil.",
      link: "/profile",
    }),
  passwordUpdated: (userId: string) =>
    createNotification(userId, {
      type: "password",
      title: "Mot de passe modifié",
      message: "Votre mot de passe a été mis à jour.",
      link: "/settings",
    }),
  characterCreated: (userId: string, name: string) =>
    createNotification(userId, {
      type: "character",
      title: "Personnage créé",
      message: `« ${name} » a été ajouté à vos personnages.`,
      link: "/characters",
    }),
};
