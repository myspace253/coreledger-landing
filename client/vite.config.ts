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
  build: {
    // vendor-three (three.js + @react-three/fiber + @react-three/drei) is
    // inherently large and will always trip the default 500KB warning on its
    // own — but it's isolated via manualChunks below AND lazy-loaded via
    // React.lazy(NodeSphere), so it's never part of the initial page load.
    // Raised just above its current size (~885KB) so the warning only fires
    // again if something regresses (e.g. NodeSphere's lazy-loading breaks, or
    // a new heavy dependency lands in the main bundle), rather than being a
    // permanent, ignorable false alarm on every build.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // `NodeSphere` is already lazy-loaded (React.lazy), so three.js only
        // downloads when someone actually lands on the hero section — but
        // without this, chunking can still merge its vendor deps into
        // whatever chunk happens to import them first. Splitting these into
        // their own named chunks makes that separation explicit and keeps
        // the animation libraries (used across many components, so not
        // lazy-loadable the same way) out of the three.js chunk and vice versa.
        //
        // Function form (rather than the older `{ name: [ids] }` object
        // shorthand) because this Vite version's bundler (Rolldown) only
        // types the function signature for manualChunks.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'vendor-three'
            if (id.includes('framer-motion') || id.includes('gsap')) return 'vendor-motion'
          }
        },
      },
    },
  },
})
