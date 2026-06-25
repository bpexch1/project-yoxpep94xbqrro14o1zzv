import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "superdev-tagger";

const isDev = process.env.NODE_ENV === "development";

if (isDev) {
  process.env.SUPERDEV_SANDBOX = "true";
}

export default defineConfig(({ mode }) => ({
  base: "/", 
  server: {
    allowedHosts: [".mysuperdev.app", ".superdev.r"],
    host: "::",
    port: 8080,
    proxy: {
      "/api/integrations": {
        target: "https://superdev.build",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/integrations/, ""),
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
