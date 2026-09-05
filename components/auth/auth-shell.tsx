import Image from "next/image";
import Link from "next/link";

export function AuthShell({
  title,
  description,
  children,
  footer,
  activeTab,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Which of the two auth pages is showing, for the Sign in / Sign up switcher — omit to hide it (reset/update password, onboarding, check-email). */
  activeTab?: "login" | "register";
}) {
  return (
    // Fixed light editorial look, same fixed palette as the marketing
    // landing page — not theme-toggled, so it stays consistent whether the
    // visitor arrived with dark mode on or off.
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-4 py-12 font-display">
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Image src="/logo.png" alt="RYNVA" width={32} height={32} />
          <span className="text-lg font-semibold tracking-tight text-ink">RYNVA</span>
        </Link>

        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_24px_60px_-24px_rgba(20,20,18,0.25)] sm:p-8">
          {activeTab && (
            <div className="mb-6 flex rounded-full border border-ink/10 bg-cream p-1">
              <Link
                href="/login"
                className={`flex-1 rounded-full py-2 text-center text-sm font-medium transition-colors ${
                  activeTab === "login" ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className={`flex-1 rounded-full py-2 text-center text-sm font-medium transition-colors ${
                  activeTab === "register" ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                Inscription
              </Link>
            </div>
          )}

          <div className="mb-6 text-center">
            <h1 className="text-xl font-medium tracking-tight text-ink">{title}</h1>
            {description && <p className="mt-1.5 text-sm text-ink-muted">{description}</p>}
          </div>
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthDivider({ label = "ou" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-ink-muted">
      <span className="h-px flex-1 bg-ink/10" />
      {label}
      <span className="h-px flex-1 bg-ink/10" />
    </div>
  );
}
