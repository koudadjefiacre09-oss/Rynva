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
    // Fixed light editorial design (warm off-white + ink), not theme-toggled
    // like the authenticated app — same reasoning as the previous dark
    // version, just a different fixed palette.
    <div className="min-h-screen bg-cream font-display text-ink">
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
