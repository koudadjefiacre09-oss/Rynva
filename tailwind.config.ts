import type { Config } from "tailwindcss";

// RYNVA design tokens — derived from the brand brief + logo.
// Base-4/8 spacing scale, dark-first palette, restrained purple→blue gradient.
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware — see the CSS variables in globals.css (:root = light,
        // .dark = the original navy palette). <alpha-value> keeps opacity
        // modifiers (bg-background/80) working.
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          secondary: "rgb(var(--color-surface-secondary) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
        },
        brand: {
          purple: "#785CFF",
          blue: "#3D88FF",
          accent: "#A855F7",
        },
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        },
        success: "#3DDC84",
        warning: "#F5A623",
        danger: "#FF5C5C",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      // 4/8px spacing scale additions beyond Tailwind defaults
      spacing: {
        "4.5": "1.125rem",
        "18": "4.5rem",
        "22": "5.5rem",
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "28px",
        full: "9999px",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #785CFF 0%, #3D88FF 100%)",
        "gradient-accent": "linear-gradient(135deg, #A855F7 0%, #3D88FF 100%)",
        "gradient-radial-glow":
          "radial-gradient(circle at 50% 0%, rgba(120,92,255,0.25) 0%, rgba(7,9,16,0) 60%)",
        // Marketing landing page palette — blue accent on black/gray-900.
        "gradient-blue": "linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(120, 92, 255, 0.45)",
        "glow-blue": "0 0 40px -10px rgba(61, 136, 255, 0.45)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 2.5s linear infinite",
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
