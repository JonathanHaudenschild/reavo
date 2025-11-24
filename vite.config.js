import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  build: {
    outDir: 'assets/build',
    rollupOptions: {
      input: 'assets/css/src.css',
      output: {
        entryFileNames: 'main.js',
        assetFileNames: (assetInfo) => {
          // Keep font files with their original names
          if (assetInfo.name.endsWith('.ttf') ||
              assetInfo.name.endsWith('.woff') ||
              assetInfo.name.endsWith('.woff2')) {
            return '[name][extname]'
          }
          // CSS files get named main.css
          return 'main.css'
        }
      }
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ]
    }
  }
})