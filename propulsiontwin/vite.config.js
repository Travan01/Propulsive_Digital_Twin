import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Node v20 compatible vite config
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // Ensure chunks work with Electron file:// protocol
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Allow Electron to connect
    host: 'localhost',
  },
  // Suppress Node.js built-in warnings in v20
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts'],
  },
  define: {
    // Prevent "process is not defined" errors in browser context
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})
