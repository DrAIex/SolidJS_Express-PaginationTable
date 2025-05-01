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
  },
  base: BASE_PATH,
})
