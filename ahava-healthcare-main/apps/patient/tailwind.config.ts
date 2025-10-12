import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { 500: '#0066CC', 600: '#0052A3', 700: '#003D7A' },
        secondary: { 500: '#00A86B', 600: '#008656' },
      },
    },
  },
  plugins: [],
};

export default config;


