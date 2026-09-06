import { getResendClient, getFromAddress, isEmailConfigured } from "@/lib/email/resend";

function welcomeEmailHtml(name: string) {
  const firstName = name.trim().split(/\s+/)[0] || "";
  return `
<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:0;background-color:#EFEFEA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EFEFEA;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;">
                <img
                  src="https://rynva.app/logo-icon.png"
                  width="28"
                  height="28"
                  alt="RYNVA"
                  style="display:inline-block;vertical-align:middle;border-radius:6px;"
                />
                <span style="display:inline-block;vertical-align:middle;margin-left:8px;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#141412;">RYNVA</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <h1 style="margin:0;font-size:24px;line-height:1.3;color:#141412;font-weight:600;">
                  Bienvenue${firstName ? `, ${firstName}` : ""} !
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#6B6B62;">
                  Votre compte RYNVA est créé. Vous avez maintenant accès à un studio créatif
                  complet propulsé par l'IA : génération d'images, de vidéos, de designs et
                  d'audio, réunis au même endroit.
                </p>
                <p style="margin:0;font-size:15px;line-height:1.6;color:#6B6B62;">
                  Si vous avez reçu un email de confirmation séparé, cliquez sur son lien pour
                  activer votre compte avant de vous connecter.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;">
                <a
                  href="https://rynva.app/dashboard"
                  style="display:inline-block;background-color:#141412;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:9999px;"
                >
                  Accéder à mon studio
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #EFEFEA;">
                <p style="margin:0;font-size:12px;color:#A0A099;">
                  Vous recevez cet email car un compte a été créé sur RYNVA avec cette adresse.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

/**
 * Sends a welcome email via Resend right after signup (app/auth/actions.ts).
 * Best-effort and non-blocking: signup already succeeded in Supabase by the
 * time this runs, so a delivery failure here is logged and swallowed rather
 * than surfaced as a signup error.
 *
 * This is separate from Supabase's own confirmation email (still sent by
 * `supabase.auth.signUp`'s `emailRedirectTo`) — for that one to be reliably
 * delivered too, set Resend as Supabase's custom SMTP provider in the
 * Supabase dashboard (Project Settings -> Auth -> SMTP Settings, host
 * smtp.resend.com, user "resend", password = your Resend API key). This
 * function can't do that part; it's dashboard-only configuration.
 */
export async function sendWelcomeEmail(to: string, name: string) {
  if (!isEmailConfigured) {
    console.warn("[sendWelcomeEmail] RESEND_API_KEY missing — skipping welcome email.");
    return;
  }

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: "Bienvenue sur RYNVA 👋",
      html: welcomeEmailHtml(name),
    });
    if (error) console.error("[sendWelcomeEmail] Resend error:", error);
  } catch (err) {
    console.error("[sendWelcomeEmail] failed:", err);
  }
}
