/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sp: {
          bg:           '#0a0a0a',
          card:         '#1a1a1a',
          border:       '#333333',
          green:        '#1D9E75',
          'green-dark': '#0F6E56',
          'green-light':'#9FE1CB',
          muted:        '#888888',
        },
      },
      fontFamily: {
        impact: ['Anton', 'Impact', 'Arial Black', 'sans-serif'],
        sans:   ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
