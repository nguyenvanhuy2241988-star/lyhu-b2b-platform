import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-be-vietnam-pro)', 'sans-serif'],
            },
            colors: {
                // LYHU brand colors
                primary: {
                    50: '#e6f7f7',
                    100: '#cceeee',
                    200: '#99dee0',
                    300: '#66ced1',
                    400: '#33bec3',
                    500: '#00afa9', // New Brand Teal
                    600: '#009a95',
                    700: '#007b77',
                    800: '#005b58',
                    900: '#003a39',
                    DEFAULT: "#00afa9",
                    foreground: "#FFFFFF",
                },
                secondary: {
                    50: '#f7fdf0',
                    100: '#eefbd1',
                    200: '#deef99',
                    300: '#cdde66',
                    400: '#bcce33',
                    500: '#98c93c', // New Brand Lime Green
                    600: '#7ba331',
                    700: '#5e7d26',
                    800: '#41571a',
                    900: '#24310f',
                    DEFAULT: "#98c93c",
                    foreground: "#FFFFFF",
                },
            },
        },
    },
    plugins: [],
};
export default config;
