import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Libraries go in their own files: they change far less often than the app, so a returning visitor
// (or a portfolio that embeds the Golu) only downloads the app's own code again after an update.
const vendor = (id) => {
  if (!id.includes('node_modules') || id.includes('@vercel')) return undefined
  if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
  if (id.includes('node_modules/@supabase/')) return 'supabase'
  return 'three' // three.js and the react-three libraries
}

// `npm run build:single` inlines everything into one HTML file (used for the shareable preview).
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: mode === 'single' ? { outDir: 'dist-single', assetsInlineLimit: 100000000 } : { rollupOptions: { output: { manualChunks: vendor } } },
}))
