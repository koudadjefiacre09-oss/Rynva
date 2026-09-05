import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Vérifiez votre email" };

export default function CheckEmailPage() {
  return (
    <AuthShell
      title="Vérifiez votre boîte mail"
      description="Nous vous avons envoyé un lien de confirmation pour activer votre compte RYNVA."
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center text-sm text-ink-muted">
        <MailCheck className="h-10 w-10 text-ink" strokeWidth={1.5} />
        <p>Cliquez sur le lien reçu par email pour terminer votre inscription.</p>
      </div>
    </AuthShell>
  );
}
