import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["var(--font-body)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-heading)", "Space Grotesk", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        orange: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
      },
      animation: {
        "float":       "float 3.5s ease-in-out infinite",
        "spin-slow":   "spin-slow 14s linear infinite",
        "marquee":     "marquee 22s linear infinite",
        "pulse-glow":  "pulse-glow 2.5s ease-in-out infinite",
        "shimmer":     "shimmer 2.5s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-14px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 24px rgba(249,115,22,0.4), 0 4px 24px rgba(249,115,22,0.15)" },
          "50%":      { boxShadow: "0 0 60px rgba(249,115,22,0.8), 0 8px 40px rgba(249,115,22,0.35)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
