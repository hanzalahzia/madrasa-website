import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: "#f0f7f3",
          100: "#dceee4",
          200: "#bcdccb",
          300: "#8fc3aa",
          400: "#5ea684",
          500: "#3d8a68",
          600: "#2d7054",
          700: "#265b46",
          800: "#21493a",
          900: "#1c3d31",
          950: "#0a241c"
        },
        brand: {
          50: "#f4f8f5",
          100: "#e6efea",
          200: "#cfe0d6",
          300: "#a8c8b7",
          400: "#79a891",
          500: "#538a70",
          600: "#3f6e58",
          700: "#335849",
          800: "#2b473c",
          900: "#243b32",
          950: "#064e3b"
        },
        gold: {
          50: "#faf6ec",
          100: "#f3ead2",
          200: "#e7d5a6",
          300: "#d9bc74",
          400: "#cfa957",
          500: "#c8a45d",
          600: "#b08643",
          700: "#8e6838",
          800: "#755432",
          900: "#63472d"
        },
        ivory: "#F8F5EC",
        ink: "#202923",
        muted: "#6B746E"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Manrope", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["var(--font-display)", "Cormorant Garamond", "Georgia", "serif"],
        urdu: ["var(--font-urdu)", "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "serif"],
        arabic: ["var(--font-arabic)", "Amiri", "Traditional Arabic", "serif"]
      },
      boxShadow: {
        soft: "0 24px 70px -34px rgba(6, 78, 59, 0.38)",
        card: "0 2px 16px -6px rgba(32, 41, 35, 0.12)",
        premium: "0 30px 80px -40px rgba(6, 78, 59, 0.5), 0 2px 12px -6px rgba(32, 41, 35, 0.14)",
        glow: "0 0 0 1px rgba(200, 164, 93, 0.18), 0 18px 60px -28px rgba(200, 164, 93, 0.55)"
      },
      borderRadius: {
        xl2: "1.25rem",
        "4xl": "2rem"
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" }
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        },
        floatSlow: {
          "0%,100%": { transform: "translate3d(0,0,0) rotate(0deg)" },
          "50%": { transform: "translate3d(0,-14px,0) rotate(1.5deg)" }
        },
        aurora: {
          "0%,100%": { transform: "translate3d(-4%, -2%, 0) scale(1)", opacity: "0.55" },
          "50%": { transform: "translate3d(5%, 3%, 0) scale(1.08)", opacity: "0.85" }
        },
        gradientShift: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        shine: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" }
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.5", transform: "scale(0.98)" },
          "50%": { opacity: "0.95", transform: "scale(1.02)" }
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        }
      },
      animation: {
        fadeUp: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both",
        fadeIn: "fadeIn 0.6s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
        float: "float 6s ease-in-out infinite",
        floatSlow: "floatSlow 11s ease-in-out infinite",
        aurora: "aurora 16s ease-in-out infinite",
        gradientShift: "gradientShift 8s ease infinite",
        shine: "shine 1.8s ease-in-out infinite",
        pulseGlow: "pulseGlow 4s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        spinSlow: "spinSlow 26s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
