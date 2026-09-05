import { Resend } from "resend";

/**
 * Whether Resend is configured. Same graceful-degradation pattern as
 * isSupabaseConfigured / isAdminConfigured: features that depend on it
 * degrade instead of crashing when the key is missing (e.g. local dev
 * without a Resend account yet).
 */
export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY);

// The Resend sandbox address — works with zero setup, but only delivers to
// the email the Resend account itself was signed up with. Once a sending
// domain is verified in the Resend dashboard, set RESEND_FROM_EMAIL to an
// address on that domain (e.g. "RYNVA <hello@rynva.app>") to send to anyone.
const DEFAULT_FROM = "RYNVA <onboarding@resend.dev>";

export function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
}
