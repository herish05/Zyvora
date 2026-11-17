import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B1B1B",
        ivory: "#F7F3EE",
        gold: "#A8742A",
        dusk: "#2E3438"
      }
    }
  },
  plugins: []
};

export default config;
