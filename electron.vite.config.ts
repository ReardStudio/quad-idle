import { defineConfig } from 'electron-vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const csp = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'";

export default defineConfig({
  main: {},
  preload: {
    build: {
      externalizeDeps: false,
    }
  },
  renderer: {
    build: { minify: true },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'csp',
        apply: 'build',
        transformIndexHtml: html => html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${csp}" />`)
      }
    ]
  }
});
