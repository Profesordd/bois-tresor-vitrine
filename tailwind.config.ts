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
        brand: {
          50:  '#ECFBF5',
          100: '#C9F3E3',
          200: '#94E4C8',
          300: '#5ECFAD',
          400: '#2FB88E',
          500: '#0F8F6B',
          600: '#0C7256',
          700: '#0A5C45',
          800: '#084633',
          900: '#06301F',
        },
        ink: '#0E1B16',
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
