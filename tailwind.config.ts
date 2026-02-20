import type { Config } from "tailwindcss";
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    /**
     * BREAKPOINTS - Sistema de Responsividade
     *
     * Mobile-first: estilos base = mobile, prefixos = telas maiores
     *
     * ┌─────────┬─────────┬──────────────────────────────────────────┐
     * │ Prefixo │ Min-W   │ Dispositivos                             │
     * ├─────────┼─────────┼──────────────────────────────────────────┤
     * │ (base)  │ 0px     │ Smartphones portrait (iPhone SE, etc.)   │
     * │ xs      │ 475px   │ Smartphones landscape / phones grandes   │
     * │ sm      │ 640px   │ Tablets pequenos / phones XL landscape   │
     * │ md      │ 768px   │ Tablets portrait (iPad Mini, iPad)       │
     * │ lg      │ 1024px  │ Tablets landscape / laptops pequenos     │
     * │ xl      │ 1280px  │ Laptops / desktops                      │
     * │ 2xl     │ 1536px  │ Desktops grandes / monitores             │
     * └─────────┴─────────┴──────────────────────────────────────────┘
     *
     * Uso no JSX: className="text-sm xs:text-base md:text-lg xl:text-xl"
     */
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem", // 16px - mobile
        xs: "1.25rem", // 20px - phones grandes
        sm: "1.5rem", // 24px - tablets pequenos
        md: "2rem", // 32px - tablets
        lg: "2rem", // 32px - laptops
        xl: "2.5rem", // 40px - desktops
        "2xl": "3rem", // 48px - desktops grandes
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--elk-border))",
        "border-muted": "hsl(var(--elk-border-muted))",
        input: "hsl(var(--elk-input))",
        ring: "hsl(var(--elk-ring))",
        background: "hsl(var(--elk-background))",
        foreground: "hsl(var(--elk-foreground))",
        primary: {
          DEFAULT: "hsl(var(--elk-primary))",
          foreground: "hsl(var(--elk-primary-foreground))",
          light: "hsl(var(--elk-primary-light))",
          dark: "hsl(var(--elk-primary-dark))",
          soft: "hsl(var(--elk-primary-soft))",
        },
        secondary: {
          DEFAULT: "hsl(var(--elk-secondary))",
          foreground: "hsl(var(--elk-secondary-foreground))",
          light: "hsl(var(--elk-secondary-light))",
          dark: "hsl(var(--elk-secondary-dark))",
        },
        destructive: {
          DEFAULT: "hsl(var(--elk-destructive))",
          foreground: "hsl(var(--elk-destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--elk-success))",
          foreground: "hsl(var(--elk-success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--elk-warning))",
          foreground: "hsl(var(--elk-warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--elk-muted))",
          foreground: "hsl(var(--elk-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--elk-accent))",
          foreground: "hsl(var(--elk-accent-foreground))",
          light: "hsl(var(--elk-accent-light))",
          soft: "hsl(var(--elk-accent-soft))",
        },
        popover: {
          DEFAULT: "hsl(var(--elk-popover))",
          foreground: "hsl(var(--elk-popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--elk-card))",
          foreground: "hsl(var(--elk-card-foreground))",
        },
      },
      /**
       * TIPOGRAFIA
       * Mapeamento dos tokens CSS para classes Tailwind
       */
      fontSize: {
        xs: "var(--font-size-xs)", // 12px
        sm: "var(--font-size-sm)", // 14px
        base: "var(--font-size-base)", // 16px
        lg: "var(--font-size-lg)", // 18px
        xl: "var(--font-size-xl)", // 20px
        "2xl": "var(--font-size-2xl)", // 24px
        "3xl": "var(--font-size-3xl)", // 32px
        "4xl": "var(--font-size-4xl)", // 40px
        "5xl": "var(--font-size-5xl)", // 48px
      },
      lineHeight: {
        tight: "var(--line-height-tight)", // 1.2
        snug: "var(--line-height-snug)", // 1.4
        normal: "var(--line-height-normal)", // 1.6
        relaxed: "var(--line-height-relaxed)", // 1.75
      },
      letterSpacing: {
        tighter: "var(--letter-spacing-tight)", // -0.02em
        normal: "var(--letter-spacing-normal)", // 0
        wide: "var(--letter-spacing-wide)", // 0.02em
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        primary: "var(--shadow-primary)",
        "primary-lg": "var(--shadow-primary-lg)",
        elegant: "var(--shadow-elegant)",
        glow: "var(--shadow-glow)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
      },
      keyframes: {
        /**
         * ANIMAÇÕES DE ENTRADA
         * Usadas para elementos que aparecem na tela
         */
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },

        /**
         * ANIMAÇÕES DECORATIVAS
         * Usadas em elementos de background e destaque
         */
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "diamond-rotate": {
          "0%, 100%": { transform: "translate(-50%, -50%) rotate(0deg)" },
          "50%": { transform: "translate(-50%, -50%) rotate(8deg)" },
        },
        "hex-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "hex-breathe": {
          "0%, 100%": { transform: "rotate(-1deg) scale(1.05)" },
          "50%": { transform: "rotate(1deg) scale(1.08)" },
        },

        /**
         * ANIMAÇÕES DE INTERAÇÃO
         * Usadas em cards e elementos interativos
         */
        "card-pulse": {
          "0%, 100%": {
            transform: "scale(1)",
            background: "rgba(255, 255, 255, 0.1)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
          "33.33%": {
            transform: "scale(1.03)",
            background: "rgba(255, 255, 255, 0.15)",
            borderColor: "hsl(var(--elk-accent) / 0.5)",
          },
          "66.66%": {
            transform: "scale(1)",
            background: "rgba(255, 255, 255, 0.1)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
        },

        /**
         * ANIMAÇÃO DE CARROSSEL
         * Scroll infinito horizontal para logos de clientes
         */
        "clients-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% / 3))" },
        },
      },
      animation: {
        // Entrada
        "fade-in": "fade-in 0.6s ease-out",
        "slide-up": "slide-up 0.8s ease-out",
        // Decorativas
        float: "float 3s ease-in-out infinite",
        "diamond-rotate": "diamond-rotate 5s ease-in-out infinite",
        "hex-spin": "hex-spin 20s ease-in-out infinite",
        "hex-breathe": "hex-breathe 10s ease-in-out infinite",
        // Interação
        "card-pulse": "card-pulse 3s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        // Carrossel
        "clients-scroll": "clients-scroll 60s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
