/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1a1a1a",
        sand: "#f6f3ee",
        accent: "#b08968",
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "serif"],
      },
    },
  },
  plugins: [],
};
