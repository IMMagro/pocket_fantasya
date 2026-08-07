/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#FDFBF7',
          100: '#F7F2E7',
          200: '#EDE4CE',
          300: '#DFD1B0',
          800: '#3A3226',
          900: '#231E17',
        },
        slateink: {
          800: '#242D35',
          900: '#161D24',
          950: '#0E1318',
        }
      },
      fontFamily: {
        serif: ['"Fraunces"', '"Cinzel"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Outfit"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card-tactile': '0 8px 24px -4px rgba(0, 0, 0, 0.28), 0 2px 6px -1px rgba(0, 0, 0, 0.16)',
        'card-hover': '0 20px 35px -8px rgba(0, 0, 0, 0.38), 0 4px 12px rgba(0, 0, 0, 0.22)',
        'glow-gold': '0 0 25px rgba(234, 179, 8, 0.5)',
        'glow-purple': '0 0 25px rgba(168, 85, 247, 0.5)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.5)',
      }
    },
  },
  plugins: [],
}
