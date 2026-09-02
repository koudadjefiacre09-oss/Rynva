import { Hero } from "@/components/marketing/hero";
import { ToolsTeaser } from "@/components/marketing/tools-teaser";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <ToolsTeaser />
      <SiteFooter />
    </div>
  );
}
