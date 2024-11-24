import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('/react/')) return 'react-vendor';
            if (id.includes('react-dom')) return 'react-vendor';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('i18next') || id.includes('react-i18next') || id.includes('i18next-browser-languagedetector') || id.includes('i18next-http-backend')) return 'i18n';
            if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('sonner') || id.includes('vaul')) return 'ui-vendor';
            if (id.includes('date-fns')) return 'date-fns';
            if (id.includes('jszip')) return 'jszip';
            return 'vendor';
          }
        }
      }
    }
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
