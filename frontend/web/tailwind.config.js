/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Consistent brand palette
        'brand-primary': '#D76B27',
        'brand-secondary': '#EECFAF', 
        'brand-accent': '#A7A87A',
        'brand-highlight': '#E67E22',
        'brand-text': '#3A2E1E',
        'brand-text-secondary': '#6B5E52',
        'brand-bg': '#FFF9F3',
        'brand-surface': '#FFFFFF',
        'brand-border': '#E5E7EB',
        'brand-muted': '#F9FAFB',
        // Status colors
        'status-success': '#10B981',
        'status-warning': '#F59E0B', 
        'status-error': '#EF4444',
        'status-info': '#3B82F6',
        // Dark mode counterparts
        'brand-primary-dark': '#E67E22',
        'brand-secondary-dark': '#C3541A',
        'brand-accent-dark': '#FFB347',
        'brand-bg-dark': '#1C1C1C',
        'brand-surface-dark': '#2A1F18',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
    },
  },
  plugins: [],
}