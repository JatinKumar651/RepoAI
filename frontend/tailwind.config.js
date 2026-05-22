/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0e7ff",
          100: "#ddc4ff",
          200: "#bb8eff",
          300: "#9a58ff",
          400: "#7c3aed",
          500: "#6d28d9",
          600: "#5b21b6",
          700: "#4c1d95",
          800: "#3b0764",
          900: "#1e0336",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        neon: "#10b981",
        space: "#030712",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "sans-serif"],
        mono: ["'Fira Code'", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glow-violet": "radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)",
        "glow-cyan": "radial-gradient(ellipse at center, rgba(6,182,212,0.15) 0%, transparent 70%)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow": "spin 20s linear infinite",
        "gradient": "gradient 8s ease infinite",
        "slide-up": "slideUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.6s ease forwards",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        gradient: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        glow: {
          from: { boxShadow: "0 0 20px rgba(124,58,237,0.3)" },
          to: { boxShadow: "0 0 40px rgba(124,58,237,0.7), 0 0 80px rgba(6,182,212,0.3)" },
        },
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        "glow-violet": "0 0 30px rgba(124,58,237,0.4)",
        "glow-cyan": "0 0 30px rgba(6,182,212,0.4)",
        "glow-sm": "0 0 15px rgba(124,58,237,0.25)",
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
      },
    },
  },
  plugins: [],
};
