import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Garante que o Vite não quebre os tipos de arquivos no Netlify
    minify: 'terser', 
    cssCodeSplit: false,
  }
})