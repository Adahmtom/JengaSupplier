import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        base: '#0a0a0a',
        surface: '#0f0f0f',
        'surface-2': '#141414',
        'surface-3': '#1a1a1a',
        border: {
          subtle: '#1e1e1e',
          DEFAULT: '#2a2a2a',
          hover: '#3a3a3a',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#dbb95c',
          dark: '#8a7030',
        },
        text: {
          primary: '#f0e6c8',
          secondary: '#c8bca0',
          muted: '#888880',
          subtle: '#555550',
        },
        alert: '#c94c4c',
        success: '#70c48a',
        info: '#7aaee0',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.2em',
        wider: '0.15em',
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        lg: '6px',
        xl: '8px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
