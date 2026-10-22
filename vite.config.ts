import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Hosts like GoDaddy's preview run `npm run dev` and assign the port via PORT
    host: process.env.PORT ? "0.0.0.0" : undefined,
    port: Number(process.env.PORT) || 5173,
    allowedHosts: process.env.PORT ? true : undefined,
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET || "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
