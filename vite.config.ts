import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /** Open browser when you run `npm run dev` */
    open: true,
    /** Bind to all interfaces so http://127.0.0.1:5173/ works if localhost misbehaves */
    host: true,
    port: 5173,
    strictPort: false,
  },
})
