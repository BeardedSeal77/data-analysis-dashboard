/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../app/**/*.{js,ts,jsx,tsx,mdx}",
    "../01_TaskManagement/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../02_Project/**/*.{js,ts,jsx,tsx,mdx}",
    "./**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        // HDPSA Brand Colors
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
        },
        secondary: "var(--color-secondary-500)",
        accent: "var(--color-accent-500)",
        warning: "var(--color-warning-500)",
        base: "var(--color-base)",
        surface: "var(--color-surface)",
        overlay: "var(--color-overlay)",
        muted: "var(--color-muted)",
        subtle: "var(--color-subtle)",
        text: "var(--color-text)",
        success: "var(--color-success-500)",
        danger: "var(--color-danger-500)",
        gold: "var(--color-gold-500)",
        rose: "var(--color-rose-500)",
        pine: "var(--color-pine-500)",
        "highlight-med": "var(--color-highlight-med)",
        "highlight-high": "var(--color-highlight-high)",
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
      }
    },
  },
  plugins: [],
};
