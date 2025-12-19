
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Isso garante que o código geminiService.ts consiga ler a chave da Vercel
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  }
});
