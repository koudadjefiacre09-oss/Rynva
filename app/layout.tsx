import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { Toaster } from "@/components/ui/toaster";
import { TrackVisit } from "@/components/analytics/track-visit";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Secondary font — a serif italic accent used for a single emphasised word
// in landing-page headings (see tailwind.config.ts's "display-serif" key).
// Everything else on the site, including those same headings, is Inter.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RYNVA : créez, éditez et innovez avec l'IA",
    template: "%s · RYNVA",
  },
  description:
    "RYNVA est une plateforme créative alimentée par l'intelligence artificielle : images, vidéos, designs et audio générés par IA, réunis dans un seul studio.",
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "RYNVA : créez, éditez et innovez avec l'IA",
    description:
      "Créez, éditez et gérez vos contenus créatifs avec l'IA : image, vidéo, design, audio.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RYNVA : créez, éditez et innovez avec l'IA",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${instrumentSerif.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body>
        <ThemeScript />
        <ThemeProvider>
          <TrackVisit />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
