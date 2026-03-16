/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: (() => {
    const proxyTarget = process.env.FUNCTIONS_PROXY || process.env.VITE_FUNCTIONS_BASE_URL || "";
    const base = {
      host: "::",
      port: 8080,
    } as any;

    // Existing proxy for your own backend functions (if any)
    if (proxyTarget) {
      base.proxy = {
        ...base.proxy,
        "/api/functions": {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/functions/, ""),
        },
      };
    }

    // NEW: Proxy for Tell A Bot API to bypass CORS
    base.proxy = {
      ...base.proxy,
      "/api/tellabot": {
        target: "https://www.tellabot.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/api\/tellabot/, "/sims/api_command.php"),
        configure: (proxy: { on: (arg0: string, arg1: (proxyReq: any, req: any) => void) => void; }, options: any) => {
          proxy.on("proxyReq", (proxyReq: { path: string; }, req: { url: string | { toString: () => string; }; }) => {
            // Forward original query parameters (cmd, user, api_key, etc.)
            if (req.url) {
              const url = new URL(req.url, "http://localhost");
              proxyReq.path += url.search; // Append ?cmd=...&user=... etc.
            }
          });
        },
      },
    };

    return base;
  })(),
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));