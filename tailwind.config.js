/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      animation: {
        "blob":       "blob 8s infinite ease-in-out",
        "fade-in":    "fadeIn 0.4s ease both",
        "slide-up":   "slideUp 0.5s ease both",
        "toast-in":   "toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
        "progress":   "progressShrink 4s linear forwards",
      },
      keyframes: {
        fadeIn:          { from: { opacity: 0, transform: "translateY(8px)"  }, to: { opacity: 1, transform: "translateY(0)"     } },
        slideUp:         { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)"     } },
        toastIn:         { from: { opacity: 0, transform: "translateX(110%)" }, to: { opacity: 1, transform: "translateX(0)"     } },
        progressShrink:  { from: { width: "100%" },                             to:   { width: "0%"   } },
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)"          },
          "33%":       { transform: "translate(30px, -40px) scale(1.1)" },
          "66%":       { transform: "translate(-20px, 20px) scale(0.9)" },
        },
      },
    },
  },
  plugins: [],
};