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
        // Bois / écorce — teinte chaude principale
        brand: {
          50:  '#FBF3EA',
          100: '#F3E1CB',
          200: '#E6C299',
          300: '#D6A468',
          400: '#BD7F42',
          500: '#9C5F2C',
          600: '#7E4A22',
          700: '#623A1B',
          800: '#452812',
          900: '#2A180A',
        },
        // Braise / flamme — accent chaleureux
        ember: {
          300: '#F6B26B',
          400: '#EE9145',
          500: '#DD7A2E',
          600: '#BC5F1E',
        },
        cream: {
          DEFAULT: '#FBF6EE',
          100: '#FBF6EE',
          200: '#F4EADA',
        },
        promo: '#B4432A',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans:  ['Inter', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
