import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'debug-resolve-alias',
      resolveId(source, importer) {
        if (source.startsWith('@components')) {
          console.log(`Resolving '${source}' from '${importer}'`)
        }
        return null // dejá que Vite siga resolviendo normalmente
      }
    }
  ],
  base: './',
  build: {
    outDir: 'dist-react',
  },
  server: {
    port: 5123,
    strictPort: true,
     headers: {
      "Content-Security-Policy":
        "default-src 'self'; connect-src 'self' ws://localhost:3000 http://localhost:3000 ws://192.168.0.*:3000 http://192.168.0.*:3000;",
    },
  },
  resolve: {
    alias: {
      '@common': path.resolve(__dirname, 'src/common'),
      "@components": path.resolve(__dirname, 'src/ui/components'),
      "@hooks": path.resolve(__dirname, 'src/ui/hooks'),
      "@views": path.resolve(__dirname, 'src/ui/views'),
      "@stores": path.resolve(__dirname, 'src/ui/stores'),
      "@ipc": path.resolve(__dirname, 'src/ui/ipc'),
      "@contexts": path.resolve(__dirname, 'src/ui/contexts'),
      "@utils": path.resolve(__dirname, 'src/app/src/utils'),
      "@entities": path.resolve(__dirname, 'src/app/src/domain/entities'),
      "@src": path.resolve(__dirname, 'src/app/src'),
      "@services": path.resolve(__dirname, 'src/app/src/services'),
      '@root': path.resolve(__dirname, './'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
