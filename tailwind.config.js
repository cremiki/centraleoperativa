/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.tsx", // Handles root .tsx files like App.tsx and index.tsx
    "./{components,contexts,pages,services}/**/*.{ts,tsx}", // Handles all subdirectories
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
