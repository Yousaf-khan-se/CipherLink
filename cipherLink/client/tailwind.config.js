/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                    950: '#052e16',
                },
                dark: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                accent: {
                    cyan: '#06b6d4',
                    purple: '#a855f7',
                    pink: '#ec4899',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'slide-left': 'slideLeft 0.3s ease-out',
                'slide-right': 'slideRight 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'bounce-in': 'bounceIn 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'typing': 'typing 1.5s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideLeft: {
                    '0%': { opacity: '0', transform: 'translateX(10px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideRight: {
                    '0%': { opacity: '0', transform: 'translateX(-10px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                bounceIn: {
                    '0%': { opacity: '0', transform: 'scale(0.3)' },
                    '50%': { transform: 'scale(1.05)' },
                    '70%': { transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(34, 197, 94, 0.5), 0 0 10px rgba(34, 197, 94, 0.3)' },
                    '100%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.4)' },
                },
                typing: {
                    '0%, 100%': { opacity: '0.2' },
                    '50%': { opacity: '1' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'cyber-grid': 'linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)',
            },
            backgroundSize: {
                'cyber-grid': '50px 50px',
            },
            boxShadow: {
                'glow-sm': '0 0 10px rgba(34, 197, 94, 0.3)',
                'glow-md': '0 0 20px rgba(34, 197, 94, 0.4)',
                'glow-lg': '0 0 30px rgba(34, 197, 94, 0.5)',
                'inner-glow': 'inset 0 0 20px rgba(34, 197, 94, 0.1)',
            },
        },
    },
    plugins: [],
}
