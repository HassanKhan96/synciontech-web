import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        paper: "var(--paper)",
        violet: "var(--violet)",
        plum: "var(--plum)",
        mist: "var(--mist)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Arial", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        lift: "0 24px 80px -36px rgba(25, 13, 48, .3)",
      },
    },
  },
  plugins: [],
};

export default config;
