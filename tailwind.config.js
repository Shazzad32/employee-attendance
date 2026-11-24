/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1726",
        paper: "#F3F5F8",
        line: "#E2E7EF",
        go: "#0F9D74",
        stop: "#D9480F",
        brand: "#0F3D5E",
      },
    },
  },
  plugins: [],
};
