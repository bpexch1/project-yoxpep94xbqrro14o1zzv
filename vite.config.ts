import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "superdev-tagger";

process.env.SUPERDEV_SANDBOX = "true";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/integrations": {
        target: "https://superdev.build",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/integrations/, "/api/integrations"),
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
