import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#03aff0',
          hover: '#009ed7',
          light: '#03aff008',
        },
        success: {
          DEFAULT: '#3b9a00',
          hover: '#338500',
        },
        warn: {
          DEFAULT: '#fbfafa',
          hover: '#ffd9d9',
        },
        error: {
          DEFAULT: '#9a3b00',
          hover: '#853300',
        },
      },
    },
  },
  plugins: [],
};

export default config;
