import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          light: "#EFF6FF",
          dark: "#1D4ED8",
        },
        secondary: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          dark: "#D97706",
        },
        clay: {
          canvas: "#F8FAFC",
          card: "#FFFFFF",
          inset: "#F1F5F9",
          slate: "#1E293B",
          muted: "#64748B",
          border: "#E2E8F0",
        },
        status: {
          success: "#10B981",
          warning: "#FBBF24",
          danger: "#EF4444",
        },
      },
      borderRadius: {
        "clay-sm": "16px",
        "clay-md": "22px",
        "clay-lg": "28px",
        "clay-xl": "32px",
        "clay-pill": "9999px",
      },
      boxShadow: {
        "clay-card": "10px 14px 24px rgba(148, 163, 184, 0.22), inset -4px -4px 8px rgba(203, 213, 225, 0.5), inset 4px 4px 8px rgba(255, 255, 255, 0.95)",
        "clay-card-hover": "12px 18px 28px rgba(148, 163, 184, 0.28), inset -4px -4px 8px rgba(203, 213, 225, 0.5), inset 4px 4px 8px rgba(255, 255, 255, 0.95)",
        "clay-inset": "inset 4px 4px 8px rgba(148, 163, 184, 0.3), inset -4px -4px 8px rgba(255, 255, 255, 0.9)",
        "clay-btn-primary": "0 10px 20px rgba(37, 99, 235, 0.35), inset -3px -3px 6px rgba(0, 0, 0, 0.25), inset 3px 3px 6px rgba(255, 255, 255, 0.4)",
        "clay-btn-accent": "0 10px 20px rgba(217, 119, 6, 0.35), inset -3px -3px 6px rgba(0, 0, 0, 0.2), inset 3px 3px 6px rgba(255, 255, 255, 0.4)",
        "clay-btn-active": "0 4px 10px rgba(37, 99, 235, 0.3), inset 2px 2px 4px rgba(0, 0, 0, 0.35)",
        "clay-badge": "3px 4px 8px rgba(148, 163, 184, 0.2), inset -2px -2px 4px rgba(0, 0, 0, 0.08), inset 2px 2px 4px rgba(255, 255, 255, 0.8)",
      },
    },
  },
  plugins: [],
};

export default config;
