/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./projects/**/*.{html,ts}', './libs/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },

      colors: {
        'ctu-blue': '#004a99',
        'ctu-gold': '#ffcc00',
        'bg-main': '#f5f7fa',
      },

      maxWidth: {
        content: '100rem',
      },

      boxShadow: {
        surface: '0 1px 3px rgba(15, 23, 42, 0.08)',
        floating: '0 18px 45px rgba(15, 23, 42, 0.12)',
      },

      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
