import type { Config } from "tailwindcss";

const config: Config = {
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
                    50: '#e6f9f5',
                    100: '#ccf3eb',
                    200: '#99e7d7',
                    300: '#66dbc3',
                    400: '#33cfaf',
                    500: '#00BFA5', // Main brand color from logo
                    600: '#00a087',
                    700: '#007d67',
                    800: '#005a47',
                    900: '#003727',
                    DEFAULT: "#00BFA5",
                    foreground: "#FFFFFF",
                },
                secondary: {
                    50: '#f1f8e9',
                    100: '#dcedc8',
                    200: '#c5e1a5',
                    300: '#aed581',
                    400: '#9ccc65',
                    500: '#8BC34A', // Green accent from logo
                    600: '#7cb342',
                    700: '#689f38',
                    800: '#558b2f',
                    900: '#33691e',
                    DEFAULT: "#8BC34A",
                    foreground: "#FFFFFF",
                },
            },
        },
    },
    plugins: [],
};
export default config;
