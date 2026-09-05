import type { Metadata } from "next";
import { Inter, Instrument_Sans, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Landing page typography only — a geometric sans paired with a serif
// italic accent (used for a single emphasised word in headings), matching
// the editorial look requested for the marketing pages.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RYNVA — Create. Edit. Innovate.",
    template: "%s · RYNVA",
  },
  description:
    "RYNVA est une plateforme créative alimentée par l'intelligence artificielle : images, vidéos, designs et audio générés par IA, réunis dans un seul studio.",
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "RYNVA — Create. Edit. Innovate.",
    description:
      "Créez, éditez et gérez vos contenus créatifs avec l'IA : image, vidéo, design, audio.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RYNVA — Create. Edit. Innovate.",
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
      className={`${inter.variable} ${instrumentSans.variable} ${instrumentSerif.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body>
        <ThemeScript />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
