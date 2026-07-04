/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        bone: 'var(--bone)',
        dim: 'var(--dim)',
        line: 'var(--line)',
        ember: 'var(--ember)',
      },
    },
  },
  plugins: [],
}
