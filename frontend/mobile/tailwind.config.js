/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Earth-tone wildlife conservation palette
        'forest-green': '#2E5D45',        // Headers
        'burnt-orange': '#D84315',        // Accents/CTAs
        'terracotta': '#C1440E',          // Secondary accent
        'ochre': '#E8961C',               // Tertiary accent
        'cream-bg': '#F5F1E8',            // Main background
        'beige-sidebar': '#E8E3D6',       // Sidebar background
        'white-card': '#FFFFFF',          // Card background
        'secondary-bg': '#FAFAF8',        // Secondary background
        
        // Text colors
        'text-primary': '#2C2416',
        'text-secondary': '#6B5E4F',
        'text-tertiary': '#4A4235',
        
        // Border colors
        'border-light': '#E8E3D6',
        'border-medium': '#D4CCBA',
        
        // Status tints
        'tint-critical': '#FEF3F2',
        'tint-rangers': '#EDF5F0',
        'tint-success': '#ECFDF5',
        'tint-warning': '#FEF9E7',
        'tint-offline': '#FAFAF8',
        
        // Status colors
        'status-success': '#10B981',
        'status-warning': '#F59E0B', 
        'status-error': '#EF4444',
        'status-info': '#3B82F6',
        
        // Legacy brand aliases for compatibility
        'brand-primary': '#2E5D45',       // Forest green for headers
        'brand-secondary': '#E8E3D6', 
        'brand-accent': '#D84315',
        'brand-highlight': '#2E5D45',
        'brand-text': '#2C2416',
        'brand-text-secondary': '#6B5E4F',
        'brand-bg': '#F5F1E8',
        'brand-surface': '#FFFFFF',
        'brand-border': '#E8E3D6',
        'brand-muted': '#FAFAF8',
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
    },
  },
  plugins: [],
}

