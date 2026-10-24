/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        trading: {
          bg: "#0B0F17",
          card: "#121824",
          cardHover: "#182234",
          border: "#1F293D",
          borderLight: "#2A364F",
          text: "#F1F5F9",
          muted: "#94A3B8",
          accent: "#38BDF8",       // Sky blue (Wind/Forecast)
          actual: "#10B981",       // Emerald green (Actual Generation)
          forecast: "#6366F1",     // Indigo/Purple (Forecast Generation)
          shortage: "#F43F5E",     // Rose/Red (Shortage - Under-hedged)
          surplus: "#F59E0B",      // Amber (Surplus - Spill)
          thermal: "#FB923C",      // Orange (Thermal Power Procured)
          grid: "#1E293B"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
