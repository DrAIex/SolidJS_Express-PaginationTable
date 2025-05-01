import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

const BASE_PATH = '/'

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    minify: true
  },
  base: BASE_PATH,
})
