import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

async function optionalImport(moduleName: string, exportName: string) {
  try {
    const mod = await import(moduleName);
    return exportName === "default" ? mod.default ?? null : mod[exportName] ?? null;
  } catch {
    return null;
  }
}

export default defineConfig(async () => {
  const plugins = [react()];

  const runtimeErrorOverlay = await optionalImport(
    "@replit/vite-plugin-runtime-error-modal",
    "default",
  );
  if (runtimeErrorOverlay) {
    plugins.push(runtimeErrorOverlay());
  }

  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    const cartographer = await optionalImport(
      "@replit/vite-plugin-cartographer",
      "cartographer",
    );
    const devBanner = await optionalImport(
      "@replit/vite-plugin-dev-banner",
      "devBanner",
    );
    if (cartographer) plugins.push(cartographer());
    if (devBanner) plugins.push(devBanner());
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
