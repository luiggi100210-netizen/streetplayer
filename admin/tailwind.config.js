/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sp: {
          bg: '#0a0a0f',
          card: '#12121a',
          border: '#1e1e2e',
          green: '#00e676',
          orange: '#ff6b2b',
        },
      },
    },
  },
  plugins: [],
};
