import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          light: '#25D366',
          dark: '#075E54',
          default: '#128C7E',
          bg: '#ECE5DD',
          teal: '#008069'
        },
        brand: {
          light: '#F59E0B', // Amber 500
          DEFAULT: '#D97706', // Amber 600
          dark: '#B45309', // Amber 700
          gold: '#C5A059', // Architectural Gold
        }
      },
    },
  },
  plugins: [],
};
export default config;
