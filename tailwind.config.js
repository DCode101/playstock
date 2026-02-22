/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
        },
        racing: {
          red: '#E10600',
          darkRed: '#8B0000',
          black: '#0A0A0A',
          gray: '#1A1A1A',
          lightGray: '#2A2A2A',
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#0f0f0f',
          950: '#000000',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'race-stripe': 'raceStripe 20s linear infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
        'gradient-flow': 'gradientFlow 3s linear infinite',
        'shimmer': 'shimmer 3s infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'border-flow': 'borderFlow 3s linear infinite',
        'neon-flicker': 'neonFlicker 1.5s ease-in-out infinite alternate',
        'particle-float': 'particleFloat 10s linear infinite',
        'pulse-red': 'pulseRed 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'speed-move': 'speedMove 0.5s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'racing-gradient': 'linear-gradient(135deg, #E10600 0%, #450a0a 100%)',
        'dark-gradient': 'linear-gradient(180deg, #000000 0%, #1A1A1A 100%)',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #E10600, 0 0 10px #E10600' },
          '100%': { boxShadow: '0 0 20px #E10600, 0 0 30px #E10600' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateX(-100px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        raceStripe: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '1000px 1000px' }
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        gradientFlow: {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' }
        },
        shimmer: {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '1' }
        },
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(225, 6, 0, 0.4), 0 0 40px rgba(225, 6, 0, 0.2)'
          },
          '50%': {
            boxShadow: '0 0 40px rgba(225, 6, 0, 0.6), 0 0 80px rgba(225, 6, 0, 0.4)'
          }
        },
        borderFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' }
        },
        neonFlicker: {
          '0%, 100%': {
            textShadow: '0 0 10px #E10600, 0 0 20px #E10600, 0 0 30px #E10600, 0 0 40px #FF4500'
          },
          '50%': {
            textShadow: '0 0 5px #E10600, 0 0 10px #E10600, 0 0 15px #E10600, 0 0 20px #FF4500'
          }
        },
        particleFloat: {
          '0%': {
            transform: 'translateY(100vh) translateX(0)',
            opacity: '0'
          },
          '10%': {
            opacity: '0.3'
          },
          '90%': {
            opacity: '0.3'
          },
          '100%': {
            transform: 'translateY(-100vh) translateX(50px)',
            opacity: '0'
          }
        },
        pulseRed: {
          '0%, 100%': {
            opacity: '1'
          },
          '50%': {
            opacity: '0.5'
          }
        },
        speedMove: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '100px 0' }
        }
      },
      boxShadow: {
        'racing-red': '0 0 30px rgba(225, 6, 0, 0.5)',
        'racing-glow': '0 0 20px rgba(225, 6, 0, 0.3), 0 0 40px rgba(225, 6, 0, 0.1)',
        'neon-red': '0 0 10px #E10600, 0 0 20px #E10600, 0 0 30px #E10600',
      }
    },
  },
  plugins: [],
}