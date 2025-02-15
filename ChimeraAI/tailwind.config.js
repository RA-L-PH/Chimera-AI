/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      maxHeight: {
        '128': '32rem',
        '144': '36rem',
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-in',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { 
            'background-position': '0% 50%',
            'background-size': '200% 200%',
          },
          '50%': { 
            'background-position': '100% 50%',
            'background-size': '200% 200%',
          },
        },
        'slide-up': {
          '0%': { 
            transform: 'translateY(100%)',
            opacity: '0',
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'slide-down': {
          '0%': { 
            transform: 'translateY(-100%)',
            opacity: '0',
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    (await import('@tailwindcss/forms')).default({
      strategy: 'class',
    }),
    (await import('@tailwindcss/typography')).default,
    (await import('tailwind-scrollbar')).default({ nocompatible: true }),
  ],
  variants: {
    extend: {
      scrollbar: ['dark', 'rounded', 'hover'],
      opacity: ['dark'],
      backgroundColor: ['dark', 'hover', 'active'],
      textColor: ['dark', 'hover', 'active'],
      borderColor: ['dark', 'hover', 'active'],
    },
  },
  darkMode: 'class',
}