import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { 500: '#00A86B', 600: '#008656', 700: '#006541' },
      },
    },
  },
  plugins: [],
};

export default config;


