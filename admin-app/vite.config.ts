import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../client"),
    },
  },
  build: {
    outDir: "admin-dist",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
  base: "/",
  server: {
    port: 5174, // Different port from main app
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/.netlify/functions": {
        target: "http://localhost:8888",
        changeOrigin: true,
      },
    },
  },
});
