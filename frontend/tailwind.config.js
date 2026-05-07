/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': '#5f5e5e',
        'primary-dim': '#535252',
        'on-primary': '#faf7f6',
        'tertiary': '#006498',
        'tertiary-dim': '#005886',
        'error': '#9f403d',
        'soft-green': '#2ECC71',
        'surface': '#f9f9f9',
        'surface-bright': '#f9f9f9',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4f4',
        'surface-container': '#ebeeef',
        'surface-container-high': '#e4e9ea',
        'surface-container-highest': '#dde4e5',
        'on-surface': '#2d3435',
        'on-surface-variant': '#5a6061',
        'outline': '#757c7d',
        'outline-variant': '#adb3b4',
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '0.5rem',
      },
      keyframes: {
        pop: {
          '0%':   { opacity: '0', transform: 'scale(0.7)' },
          '70%':  { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shine: {
          '0%':   { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        pop:     'pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        float:   'float 1.8s ease-in-out infinite',
        shine:   'shine 2.4s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
}
