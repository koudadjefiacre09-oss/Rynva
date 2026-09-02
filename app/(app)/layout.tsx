import { AppShell } from "@/components/layout/app-shell";

/**
 * Shared shell (Sidebar + Topbar) for every signed-in section — dashboard,
 * AI tools, characters, projects, profile, and anything added under this
 * `(app)` route group later. Route groups don't affect the URL, so
 * `/dashboard`, `/ai/image`, `/profile`, etc. are unchanged.
 */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
