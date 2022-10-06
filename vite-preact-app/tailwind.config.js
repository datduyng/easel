module.exports = {
    purge: ['./index.html', './src/**/*'],
    theme: {
        extend: {
            colors: {
                // ...require('tailwindcss/colors'),
                brand: {
                    // Figure out a way to automate this for self hosted users
                    // Goto https://javisperez.github.io/tailwindcolorshades to generate your brand color
                    50: "#d1d5db",
                    100: "#9ca3af",
                    200: "#6b7280",
                    300: "#4b5563",
                    400: "#374151",
                    500: "#111827", // Brand color
                    600: "#0f1623",
                    700: "#0d121d",
                    800: "#0a0e17",
                    900: "#080c13",
                    // DEFAULT: "var(--brand-color)",
                },
            },
            fontFamily: {
                sans: '"Inter", "Lucida Grande", sans-serif',
            },
        },
    },
    variants: {},
    plugins: [],
}