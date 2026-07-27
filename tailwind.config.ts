import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        samsung: {
          blue: "#1428A0",
          "blue-light": "#1E3FD0",
          "blue-dark": "#0E1C6E",
          dark: "#0B0E1A",
          card: "#141826",
          border: "#1E2540",
          accent: "#4DA6FF",
          gold: "#FFD700",
          muted: "#6B7A99",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "samsung-gradient": "linear-gradient(135deg, #1428A0 0%, #0B0E1A 100%)",
        "card-gradient": "linear-gradient(145deg, #141826, #1a2035)",
        "gold-gradient": "linear-gradient(135deg, #FFD700, #FFA500)",
      },
    },
  },
  plugins: [],
} satisfies Config;
