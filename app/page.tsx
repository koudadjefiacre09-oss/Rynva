import { Hero } from "@/components/marketing/hero";
import { StatsSection } from "@/components/marketing/stats-section";
import { ToolsTeaser } from "@/components/marketing/tools-teaser";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ExamplesGallery } from "@/components/marketing/examples-gallery";
import { PricingTeaser } from "@/components/marketing/pricing-teaser";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function LandingPage() {
  return (
    // "dark" scopes the theme CSS vars to the near-black palette regardless
    // of the visitor's light/dark preference — this landing page is a fixed
    // cinematic-dark design, not theme-toggled like the authenticated app.
    <div className="dark min-h-screen bg-black">
      <SiteHeader />
      <Hero />
      <StatsSection />
      <ToolsTeaser />
      <HowItWorks />
      <ExamplesGallery />
      <PricingTeaser />
      <SiteFooter />
    </div>
  );
}
