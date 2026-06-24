import type { Config } from "tailwindcss";

/**
 * D2P Academy brand accents (logo: d=red, p=green, 2=yellow).
 * Tailwind v4 reads color tokens from src/app/globals.css @theme.
 * This file keeps content paths and documents the accent palette.
 */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E63946",
          hover: "#F0525E",
          glow: "rgb(230 57 70 / 0.35)",
        },
        secondary: {
          DEFAULT: "#2A9D8F",
          hover: "#33B5A5",
          glow: "rgb(42 157 143 / 0.35)",
        },
        accent: {
          DEFAULT: "#FFB703",
          dark: "#D99B03",
          soft: "rgb(255 183 3 / 0.15)",
        },
        brand: {
          red: "#E63946",
          green: "#2A9D8F",
          yellow: "#FFB703",
        },
        document: {
          primary: "#2563eb",
          "primary-hover": "#1d4ed8",
        },
      },
      boxShadow: {
        "glow-primary": "0 12px 28px -8px rgb(230 57 70 / 0.4), 0 4px 12px -4px rgb(230 57 70 / 0.25)",
        "glow-secondary":
          "0 12px 28px -8px rgb(42 157 143 / 0.4), 0 4px 12px -4px rgb(42 157 143 / 0.25)",
        "glow-accent": "0 8px 20px -6px rgb(255 183 3 / 0.35)",
        "glow-document":
          "0 12px 28px -8px rgb(37 99 235 / 0.35), 0 4px 12px -4px rgb(37 99 235 / 0.2)",
      },
    },
  },
} satisfies Config;

export default config;
