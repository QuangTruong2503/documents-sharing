/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "node_modules/flowbite/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366F1",
          hover: "#4F46E5",
          soft: "#EEF2FF",
        },
        secondary: "#20970B",
        neutral: "#9C9C9C",
        canvas: "#FAFAFA",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#0A0A0A",
          secondary: "#6B6B6B",
        },
        line: "#E8E8EC",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        display: ['"General Sans"', "sans-serif"],
        sans: ['"DM Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        card: "0 8px 30px rgba(0,0,0,0.08)",
        glow: "0 4px 12px rgba(99,102,241,0.35)",
        focus: "0 0 0 3px rgba(99,102,241,0.12)",
      },
    },
  },
  plugins: [require("flowbite/plugin")],
};
