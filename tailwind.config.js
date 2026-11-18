/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bc: {
          bg: '#f0f0f0',
          darkBg: '#1e1e1e',
          panel: '#ffffff',
          darkPanel: '#252526',
          border: '#d1d5db',
          darkBorder: '#3e3e42',
          toolbar: '#e8eaed',
          darkToolbar: '#2d2d30',
          diffRed: '#ffeef0',
          diffRedDark: '#4a1d24',
          diffRedBorder: '#f97583',
          diffGreen: '#e6ffec',
          diffGreenDark: '#1b4725',
          diffGreenBorder: '#56d364',
          diffYellow: '#fffbdd',
          diffYellowDark: '#4d3800',
          diffYellowBorder: '#e3b341',
          diffBlue: '#e1f0ff',
          diffBlueDark: '#18385a',
          diffBlueBorder: '#58a6ff',
        }
      },
      fontFamily: {
        mono: ['"Cascadia Code"', '"Fira Code"', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
