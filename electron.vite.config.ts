import { resolve, join } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/app",
      lib: {
        entry: resolve(join(__dirname, "app/main.ts")),
      },
    },
    resolve: {
      alias: {
        "@": resolve(join(__dirname, "")),
        "@types": resolve(join(__dirname, "")),
        "@utils": resolve(join(__dirname, "utils")),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/preload",
      lib: {
        entry: resolve(join(__dirname, "preload/index.ts")),
      },
    },
  },
  renderer: {
    root: resolve(__dirname),
    resolve: {
      alias: {
        "@": resolve(join(__dirname, "")),
        "@renderer": resolve(join(__dirname, "frontend")),
        "@components": resolve(join(__dirname, "frontend/components")),
        "@contexts": resolve(join(__dirname, "frontend/contexts")),
      },
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          index: "index.html",
          settings: "settings.html",
        },
        onwarn(warning, warn) {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
            return;
          }
          warn(warning);
        },
      },
    },
  },
});
