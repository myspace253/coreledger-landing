import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Proxies /api requests to the Express server so the browser only ever
    // talks to one origin (whatever port 5173 is exposed as — localhost,
    // a Codespaces/Gitpod forwarded URL, etc). This avoids needing the API
    // port forwarded/exposed separately, and sidesteps CORS entirely in dev.
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
