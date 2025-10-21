/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.php", "./**/*.html", "./**/*.js", "./**/*.json"],
  theme: { 
    extend: {
      colors: {
        'amber': '#ffbe0b',
        'orange-pantone': '#fb5607',
        'rose': '#ff006e',
        'blue-violet': '#8338ec',
        'azure': '#3a86ff',
      },
      animation: {
        'heartbeat': 'heartbeat 0.6s ease-in-out',
        'pulse-heart': 'pulse-heart 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.8s ease-out',
        'fade-in': 'fadeIn 1s ease-out',
        'rotate-slow': 'rotateSlow 20s linear infinite',
        'gradient-shift': 'gradientShift 4s ease-in-out infinite',
        'particle-float': 'particleFloat 6s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'scale-pulse': 'scalePulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { 
            transform: 'scale(1)', 
            filter: 'drop-shadow(0 0 20px rgba(221, 45, 74, 0.4))'
          },
          '50%': { 
            transform: 'scale(1.15)', 
            filter: 'drop-shadow(0 0 40px rgba(221, 45, 74, 0.8))'
          },
        },
        'pulse-heart': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(221, 45, 74, 0.4)' },
          '100%': { boxShadow: '0 0 40px rgba(221, 45, 74, 0.8)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(50px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        particleFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(120deg)' },
          '66%': { transform: 'translateY(10px) rotate(240deg)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        scalePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        }
      },
      backgroundSize: {
        '300%': '300%',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    } 
  },
  plugins: [],
};