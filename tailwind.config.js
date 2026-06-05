/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Business categories — richer, moodier
        signal9: { DEFAULT: '#C4522A', light: '#2A1A12' },
        app:     { DEFAULT: '#3B82F6', light: '#0F1929' },   // electric blue — cyberpunk city
        writing: { DEFAULT: '#7C3AED', light: '#1A1128' },   // deep violet — grimdark
        personal:{ DEFAULT: '#7F77DD', light: '#15132A' },
        // Warm charcoal surfaces — pulled from the cliff/triptych images
        bg: {
          base:     '#0D0C0B',   // near-black with warm undertone
          surface:  '#161412',   // warm charcoal
          elevated: '#1F1C19',   // lifted warm dark
          glass:    'rgba(22,20,18,0.85)',
        },
        text: {
          primary:   '#F2EDE6',  // warm off-white — aged paper
          secondary: '#C8BFB5',  // readable warm mid-grey
          tertiary:  '#9A9088',  // muted — was far too dark before
        },
        // Accent pulls from the triptych
        crimson: '#8B1A1A',
        amber:   '#D4780A',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      borderRadius: { card: '10px' },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
