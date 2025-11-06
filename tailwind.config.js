/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "primary": "#135bec",
        "background-light": "#f6f6f8",
        "background-dark": "#000000",
        "accent-cyan": "#00FFFF",
        "accent-magenta": "#FF00FF",
        "vidyai-purple": "#A855F7",
        "vidyai-blue": "#3B82F6",
        "vidyai-blue-darker": "#2563EB",
      },
      fontFamily: {
        "display": ["SpaceGrotesk", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "2xl": "2rem",
        "3xl": "1.5rem",
        "full": "9999px"
      },
      boxShadow: {
        'glow-purple': '0 0 20px 0 rgba(168, 85, 247, 0.5)',
        'glow-blue': '0 0 20px 0 rgba(59, 130, 246, 0.5)',
        'glow-create': '0 0 25px 0 rgba(168, 85, 247, 0.5), 0 0 25px 0 rgba(59, 130, 246, 0.5)',
        'glow-subtle': '0 0 15px 0 rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}
