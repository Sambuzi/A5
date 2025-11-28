module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6750A4',
          container: '#EADDFF'
        },
        secondary: {
          DEFAULT: '#625B71',
          container: '#E8DEF8'
        },
        tertiary: {
          DEFAULT: '#7D5260',
          container: '#FFD8E4'
        },
        surface: '#FFFFFF',
        background: '#F7F3FF',
        'elev-1': 'rgba(0,0,0,0.06)',
        'elev-2': 'rgba(0,0,0,0.08)'
      },
      borderRadius: {
        'lg-3xl': '28px'
      },
      boxShadow: {
        'm3-1': '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.04)',
        'm3-2': '0 6px 18px rgba(16,24,40,0.08)'
      }
    },
  },
  plugins: [],
}
