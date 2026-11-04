import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * O GitHub Pages serve 404.html quando a URL não corresponde a um arquivo real.
 * Como usamos BrowserRouter, links diretos (/dashboard, /dashboard/cidades, ...)
 * só funcionam se esse 404.html for uma copia do index.html — assim o React
 * Router assume a rota no cliente.
 */
function githubPagesSpaFallback(): Plugin {
  let outDir = "dist";

  return {
    name: "github-pages-spa-fallback",
    apply: "build",

    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },

    closeBundle() {
      const index = resolve(outDir, "index.html");

      if (existsSync(index)) {
        copyFileSync(index, resolve(outDir, "404.html"));
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), githubPagesSpaFallback()],
  base:
    mode === "production"
      ? "/PFC-dashboard/"
      : "/",
}));
