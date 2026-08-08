/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        major: ["var(--font-major)", "monospace"],
      },
    },
  },
  plugins: [],
};
