import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#00684A',
          dark: '#0F172A',
          light: '#F8FAFC',
        }
      },
    },
  },
  
  plugins: [
  require('@tailwindcss/typography'),
],
};
export default config;
