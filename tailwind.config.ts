import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "rgb(11 12 12 / <alpha-value>)",
        bone: "rgb(236 231 220 / <alpha-value>)",
        ash: "rgb(141 144 150 / <alpha-value>)",
        line: "rgb(236 231 220 / 0.14)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
