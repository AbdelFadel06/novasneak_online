import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "Inter", "sans-serif"],
      },
      colors: {
        surface: "#f5f5f3",
        card: "#ececea",
      },
    },
  },
  plugins: [],
};

export default config;
