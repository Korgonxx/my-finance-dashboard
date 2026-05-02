import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        primary:     { DEFAULT: "hsl(var(--primary))",     foreground: "hsl(var(--primary-foreground))" },
        secondary:   { DEFAULT: "hsl(var(--secondary))",   foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        success:     { DEFAULT: "hsl(var(--success))" },
        warning:     { DEFAULT: "hsl(var(--warning))" },
        muted:       { DEFAULT: "hsl(var(--muted))",       foreground: "hsl(var(--muted-foreground))" },
        accent:      { DEFAULT: "hsl(var(--accent))",      foreground: "hsl(var(--accent-foreground))" },
        popover:     { DEFAULT: "hsl(var(--popover))",     foreground: "hsl(var(--popover-foreground))" },
        card:        { DEFAULT: "hsl(var(--card))",        foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "tile-pink":     "linear-gradient(180deg, hsl(var(--tile-pink)) 0%, hsl(6 82% 82%) 100%)",
        "tile-yellow":   "linear-gradient(180deg, hsl(var(--tile-yellow)) 0%, hsl(42 96% 76%) 100%)",
        "tile-lavender": "linear-gradient(180deg, hsl(var(--tile-lavender)) 0%, hsl(252 70% 84%) 100%)",
        "tile-mint":     "linear-gradient(180deg, hsl(var(--tile-mint)) 0%, hsl(152 56% 76%) 100%)",
        "tile-peach":    "linear-gradient(180deg, hsl(var(--tile-peach)) 0%, hsl(22 92% 80%) 100%)",
        "tile-blue":     "linear-gradient(180deg, hsl(var(--tile-blue)) 0%, hsl(210 80% 82%) 100%)",
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "Inter", "sans-serif"],
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in":        { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.4s cubic-bezier(0.4,0,0.2,1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;