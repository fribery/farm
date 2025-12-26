import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  alias: {
      '@': '/src',
      '@components': '/src/components',
      '@screens': '/src/components/Screens'
  },
  server: {
    host: true,
    port: 5173,
    headers: {
      'Content-Type': 'application/javascript'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})