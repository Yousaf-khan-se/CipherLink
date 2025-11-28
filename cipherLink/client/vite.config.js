import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        define: {
            // Make env variables available in client code
            'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || '/api'),
            'import.meta.env.VITE_SOCKET_URL': JSON.stringify(env.VITE_SOCKET_URL || ''),
        },
        server: {
            port: 5173,
            proxy: {
                '/api': {
                    target: 'http://127.0.0.1:4200',
                    changeOrigin: true,
                    secure: false,
                },
                '/socket.io': {
                    target: 'http://127.0.0.1:4200',
                    changeOrigin: true,
                    ws: true,
                    secure: false,
                },
            },
        },
        build: {
            outDir: 'dist',
            sourcemap: false,
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                },
            },
        },
    };
});
