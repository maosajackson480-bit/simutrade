/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
        inter: ["Manrope", "sans-serif"], // legacy alias
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        // SimuTrade — Bone/Navy/Coral palette (2026 redesign)
        bone: "#F5F5F0",
        "bone-2": "#F0F0EB",
        navy: "#1B263B",
        "navy-2": "#415A77",
        "navy-3": "#778DA9",
        coral: "#E07A5F",
        "coral-hover": "#D36649",
        "coral-light": "#F9EAE6",
        forest: "#426B1F",
        "forest-light": "#EAF0E4",
        wine: "#9E2A2B",
        "wine-light": "#F5E6E6",
        sand: "#E3B505",
        "sand-light": "#FCF6DF",
        "line-soft": "#E5E5DF",

        // shadcn tokens
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 8px 30px rgba(27,38,59,0.04)",
        "card-hover": "0 20px 40px rgba(27,38,59,0.08)",
        dropdown: "0 10px 40px rgba(27,38,59,0.12)",
        button: "0 1px 2px rgba(27,38,59,0.06)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.5s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
