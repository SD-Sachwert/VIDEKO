import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // scripts/prerender.mjs braucht die gehashten Asset-URLs (z. B. das Bild
    // eines Journalartikels als og:image), bevor es das HTML schreibt.
    manifest: true,
  },
  server: {
    watch: {
      // Static assets are dropped in (large) batches. While Windows is still
      // writing/locking a freshly added image, Vite's file watcher throws
      // EBUSY and crashes the whole dev server. Assets don't need HMR
      // watching — imports still resolve and are served — so exclude the
      // assets tree (and any locked .txt notes) from the watcher entirely.
      ignored: ['**/src/assets/**', '**/*.txt'],
    },
  },
})
