/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        signal9: { DEFAULT: '#D85A30', light: '#FAECE7' },
        app:     { DEFAULT: '#378ADD', light: '#E6F1FB' },
        writing: { DEFAULT: '#1D9E75', light: '#E1F5EE' },
        personal:{ DEFAULT: '#7F77DD', light: '#EEEDFE' },
        bg: {
          base:     '#141413',
          surface:  '#1E1E1C',
          elevated: '#282826',
        },
        text: {
          primary:   '#F0EEE8',
          secondary: '#A8A49C',
          tertiary:  '#6B6762',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      borderRadius: { card: '12px' },
    },
  },
  plugins: [],
}
