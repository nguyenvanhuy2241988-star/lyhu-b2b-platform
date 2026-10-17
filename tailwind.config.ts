import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // LYHU brand colors
                primary: {
                    50: '#e6f7f7',
                    100: '#cceeee',
                    200: '#99dee0',
                    300: '#66ced1',
                    400: '#33bec3',
                    500: '#00ABA9', // Brand Teal / Xanh ngọc
                    600: '#009795',
                    700: '#007b77',
                    800: '#005b58',
                    900: '#003a39',
                    DEFAULT: "#00ABA9",
                    foreground: "#FFFFFF",
                },
                secondary: {
                    50: '#f7fdf0',
                    100: '#eefbd1',
                    200: '#deef99',
                    300: '#cdde66',
                    400: '#bcce33',
                    500: '#8DC63F', // Brand Lime Green / Xanh lá
                    600: '#7ba331',
                    700: '#5e7d26',
                    800: '#41571a',
                    900: '#24310f',
                    DEFAULT: "#8DC63F",
                    foreground: "#FFFFFF",
                },
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                serif: ['var(--font-merriweather)', 'Georgia', 'Cambria', 'serif'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
};
export default config;
