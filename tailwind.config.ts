import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["var(--font-dm-sans)", "DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "ui-serif", "serif"],
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
        "marquee":     "marquee 18s linear infinite",
        "pulse-glow":  "pulse-glow 2.5s ease-in-out infinite",
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
          "0%, 100%": { boxShadow: "0 0 24px rgba(249,115,22,0.5), 0 4px 24px rgba(249,115,22,0.2)" },
          "50%":      { boxShadow: "0 0 48px rgba(249,115,22,0.9), 0 8px 40px rgba(249,115,22,0.4)" },
        },
      },
      ringWidth: {
        "3": "3px",
      },
      ringOpacity: {
        DEFAULT: "1",
      },
    },
  },
  plugins: [],
};

export default config;
