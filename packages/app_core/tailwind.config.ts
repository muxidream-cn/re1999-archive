import type { Config } from "tailwindcss"

module.exports = {
  content: ["./index.html", "./src/**/*.vue", "../app_web/src/**/*.vue", "../app_windows/src/**/*.vue", "../app_android/src/**/*.vue"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
