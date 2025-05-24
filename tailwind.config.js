/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#A3E635", // lime-400
          DEFAULT: "#65A30D", // lime-600
          hover: "#4D7C0F", // lime-700
        },
        secondary: "#374151", // gray-700
        accent: "#F59E0B", // amber-500
      },
      gap: {
        section: "2rem",
      },
      borderRadius: {
        container: "0.5rem",
      },
    },
  },
  plugins: [],
};
