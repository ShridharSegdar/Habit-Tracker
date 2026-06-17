/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
    theme: {
        extend: {
            colors: {
                obsidian: '#050505',
                ink: '#0A0A0B',
                cyber: '#00F0FF',
                violet: '#7B61FF',
                success: '#00FF94',
                warning: '#FFB800',
                danger: '#FF2A2A',
            },
            fontFamily: {
                display: ['Unbounded', 'sans-serif'],
                body: ['Manrope', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                glow: '0 0 30px rgba(0,240,255,0.25)',
                'glow-lg': '0 0 60px rgba(0,240,255,0.35)',
            },
        },
    },
    plugins: [],
};
