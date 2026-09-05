"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  loginSchema,
  registerSchema,
  onboardingSchema,
  updateProfileSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from "@/lib/validations/auth";
import { getCountryFromRequest } from "@/lib/geo";
import { NOTIFY } from "@/lib/notifications/create";
import { sendWelcomeEmail } from "@/lib/email/send-welcome-email";

export type AuthActionState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
} | null;

const CONFIG_ERROR =
  "Supabase n'est pas encore configuré. Ajoutez vos clés dans .env.local (voir .env.example) puis relancez le serveur.";

function fieldErrorsFromZod(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function translateAuthError(message: string) {
  if (message.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (message.includes("User already registered")) return "Un compte existe déjà avec cet email.";
  if (message.includes("Email not confirmed"))
    return "Merci de confirmer votre email avant de vous connecter.";
  return message;
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) return { error: CONFIG_ERROR };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: translateAuthError(error.message) };

  const next = formData.get("next")?.toString();
  redirect(next && next.startsWith("/") ? next : "/dashboard");
}

export async function register(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) return { error: CONFIG_ERROR };

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const country = await getCountryFromRequest();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // `country` is only ever non-null behind an edge network that sets it
      // (see lib/geo.ts) — the signup trigger (migration 0006) copies it
      // from here into profiles.country.
      data: { full_name: parsed.data.fullName, country },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: translateAuthError(error.message) };

  await sendWelcomeEmail(parsed.data.email, parsed.data.fullName);

  // If email confirmation is disabled on the Supabase project, signUp
  // already returns a session — skip straight to the dashboard.
  if (data.session) redirect("/dashboard");

  redirect("/register/check-email");
}

export async function logout() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function signInWithGoogle(): Promise<AuthActionState> {
  if (!isSupabaseConfigured) return { error: CONFIG_ERROR };

  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: translateAuthError(error.message) };
  if (data.url) redirect(data.url);
  return null;
}

export async function completeOnboarding(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) return { error: CONFIG_ERROR };

  const parsed = onboardingSchema.safeParse({ fullName: formData.get("fullName") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });
  if (error) return { error: translateAuthError(error.message) };

  redirect("/dashboard");
}

export async function updateProfile(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) return { error: CONFIG_ERROR };

  const parsed = updateProfileSchema.safeParse({ fullName: formData.get("fullName") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });
  if (error) return { error: translateAuthError(error.message) };

  if (data.user) await NOTIFY.profileUpdated(data.user.id);

  // The name is also read by the topbar/sidebar/dashboard greeting (server
  // components in the layout tree) — bust their cache so it shows up there
  // without waiting for an unrelated navigation.
  revalidatePath("/", "layout");

  return { message: "Profil mis à jour." };
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) return { error: CONFIG_ERROR };

  const parsed = resetPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  // Supabase never reveals whether the email exists — same message either way.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });

  return {
    message: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
  };
}

export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) return { error: CONFIG_ERROR };

  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFromZod(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: translateAuthError(error.message) };

  if (data.user) await NOTIFY.passwordUpdated(data.user.id);

  redirect("/dashboard");
}
