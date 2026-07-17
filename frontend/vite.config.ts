import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 🌟 ISSO AQUI força o Vite a usar caminhos relativos e resolve o erro no Netlify!
  build: {
    minify: 'terser', 
    cssCodeSplit: false,
  }
})