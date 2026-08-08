import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      backgroundImage: {
        'grid-white': "linear-gradient(to right, theme('colors.white / 5%') 1px, transparent 1px), linear-gradient(to bottom, theme('colors.white / 5%') 1px, transparent 1px)",
      },
      fontFamily: {
        body: ["var(--font-poppins)", "sans-serif"],
        headline: ["var(--font-playfair-display)", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        'mint-500': '#ECFFDC',
        'header-yellow': '#C9CF5E',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "border-anim-y": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(100vh)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "shadow-fade-in": {
          "0%": { opacity: "0", transform: "translateX(-50%) scale(0.8)" },
          "100%": { opacity: "1", transform: "translateX(-50%) scale(1.2)" },
        },
        "text-pop-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "text-slide-in": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-slow": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(124, 203, 120, 0.3)" },
          "70%": { transform: "scale(1.05)", boxShadow: "0 0 0 10px rgba(124, 203, 120, 0)" },
        },
        "mascot-idle": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg) scale(1)" },
          "25%": { transform: "translateY(-2px) rotate(-1deg) scale(1.01)" },
          "50%": { transform: "translateY(0) rotate(0deg) scale(1)" },
          "75%": { transform: "translateY(-2px) rotate(1deg) scale(1.01)" },
        },
        "loading-dot": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.5" },
          "50%": { transform: "translateY(-6px)", opacity: "1" },
        },
        "fade-in-scale": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "bounce-once": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
        draw: {
          "0%": { "stroke-dashoffset": "3000" },
          "50%": { "stroke-dashoffset": "0" },
          "100%": { "stroke-dashoffset": "3000" },
        },
        typing: {
          from: { width: "0" },
        },
        "blink-caret": {
          "0%, 49%": { borderColor: "white" },
          "50%, 100%": { borderColor: "transparent" },
        },
        "move-bg": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "40px 40px" },
        },
        "slide-up-fade": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        moveInLeft: {
          "0%": { opacity: "0", transform: "translateX(-10rem)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        moveInRight: {
          "0%": { opacity: "0", transform: "translateX(10rem)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        moveInBottom: {
          "0%": { transform: "translateY(10rem)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "border-anim-y": "border-anim-y 10s linear infinite",
        "slide-up": "slide-up 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "shadow-fade-in": "shadow-fade-in 1s ease-out forwards",
        "text-pop-in": "pop-in 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "text-slide-in": "slide-in-right 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "mascot-idle": "mascot-idle 5s ease-in-out infinite",
        "loading-dot": "loading-dot 1.4s cubic-bezier(0.45, 0, 0.55, 1) infinite",
        "fade-in-scale": "fade-in-scale 0.8s ease-out forwards",
        "bounce-once": "bounce-once 1s ease-in-out forwards",
        draw: "draw 3s ease-in-out infinite",
        typing: "typing 2.5s steps(14, end), blink-caret .5s step-end infinite alternate",
        "move-bg": "move-bg 4s linear infinite",
        "slide-up-fade": "slide-up-fade 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "slide-in-right": "slide-in-right 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "pop-in": "pop-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
