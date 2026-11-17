import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slateInk: "#111827",
        shell: "#F8F7F4",
        amberBrand: "#A8742A",
        pine: "#1F3A33"
      }
    }
  },
  plugins: []
};

export default config;
