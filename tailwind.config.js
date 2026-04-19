/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        base: '#060C1A',
        surface: '#0C1428',
        elevated: '#101C36',
        subtle: '#162442',
        accent: '#4080FF',
        'accent-muted': '#1B3A8C',
        'accent-glow': 'rgba(64, 128, 255, 0.08)',
        'accent-border': 'rgba(64, 128, 255, 0.2)',
        primary: '#EDF0FF',
        secondary: '#A0B4CE',
        dim: '#4A607E',
        border: '#1E3050',
        'border-bright': '#2A4468',
        success: '#10D98A',
        'success-bg': 'rgba(16, 217, 138, 0.08)',
        'success-border': 'rgba(16, 217, 138, 0.2)',
        warning: '#F59E0B',
        'warning-bg': 'rgba(245, 158, 11, 0.08)',
        'warning-border': 'rgba(245, 158, 11, 0.2)',
        danger: '#F06060',
        'danger-bg': 'rgba(240, 96, 96, 0.08)',
        'danger-border': 'rgba(240, 96, 96, 0.2)',
        // Legacy aliases used in scorer/schema logic
        ink: '#EDF0FF',
        muted: '#8096BC',
        'accent-light': 'rgba(64, 128, 255, 0.08)',
      },
      boxShadow: {
        card: '0 2px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(64,128,255,0.3)',
        'card-strong': '0 4px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow: '0 0 32px rgba(64, 128, 255, 0.22)',
        'glow-sm': '0 0 16px rgba(64, 128, 255, 0.15)',
        'glow-success': '0 0 24px rgba(16, 217, 138, 0.18)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400% 0' },
          '100%': { backgroundPosition: '400% 0' },
        },
      },
    },
  },
  plugins: [],
};
