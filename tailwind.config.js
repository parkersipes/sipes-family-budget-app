/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0f0f11',
          raised: '#16161a',
          elevated: '#1d1d22',
        },
        line: '#26262d',
        ink: {
          DEFAULT: '#f4f4f5',
          muted: '#9a9aa3',
          faint: '#5a5a63',
        },
        accent: {
          DEFAULT: '#3bbf7a',
          dim: '#a76f18',
        },
        ok: '#3bbf7a',
        warn: '#f5a524',
        bad: '#e5484d',
      },
      fontFamily: {
        sans: ['"Montserrat"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontFeatureSettings: {
        tnum: '"tnum"',
      },
    },
  },
  plugins: [],
};
