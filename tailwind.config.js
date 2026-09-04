/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF9F6",
        "paper-muted": "#F3F1EC",
        "paper-card": "#FFFFFF",
        ink: {
          DEFAULT: "#14151A",
          muted: "#5A5D66",
          subtle: "#8A8E99",
        },
        amber: {
          DEFAULT: "#B7791F",
          light: "#DF982D",
          dark: "#8F5C12",
          surface: "#FDF8F0",
        },
        teal: {
          DEFAULT: "#1F4D4A",
          light: "#2E706C",
          dark: "#123331",
          surface: "#F0F7F6",
        },
        gain: {
          DEFAULT: "#1E7A4C",
          surface: "#F0F8F3",
          border: "#C2E8D0",
        },
        loss: {
          DEFAULT: "#B4232C",
          surface: "#FDF2F2",
          border: "#F7C6C9",
        },
        border: {
          DEFAULT: "#E5E3DD",
          dark: "#D1CEC5",
        },
      },
      fontFamily: {
        serif: ["var(--font-lora)", "Lora", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
