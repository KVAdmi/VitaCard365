/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './index.html',
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        'vita-background': '#0c1c3e',
        'vita-foreground': '#ffffff',
        'vita-primary': '#f06340',
        'vita-secondary': '#f06340',
        'vita-card': '#ffffff',
        'vita-orange': '#f06340',
        'vita-blue': '#0c1c3e',
        'vita-muted': 'hsl(217 33% 17%)',
        'vita-accent': 'hsl(217 33% 17%)',
      },
      borderRadius: {
        lg: `0.75rem`,
        md: `calc(0.75rem - 2px)`,
        sm: `calc(0.75rem - 4px)`,
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
  safelist: [
    'bg-vita-background',
    'bg-vita-primary',
    'bg-[#0d2041]',
    // Agrega aquí otras clases dinámicas si las usas
  ],
};
