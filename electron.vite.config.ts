import { resolve, join } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

const alias = {
  "@": resolve(join(__dirname, "")),
  "@types": resolve(join(__dirname, "")),
  "@windows": resolve(join(__dirname, "windows")),
  "@components": resolve(join(__dirname, "components")),
  "@contexts": resolve(join(__dirname, "contexts")),
  "@utils": resolve(join(__dirname, "utils")),
  "@screenFormatPlugin": resolve(join(__dirname, "screenFormatPlugin")),
  "@styles": resolve(join(__dirname, "styles")),
};

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
      alias,
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias },
    build: {
      outDir: "out/preload",
      rollupOptions: {
        input: {
          index: resolve(join(__dirname, "preload/index.ts")),
        },
      },
    },
  },
  renderer: {
    root: resolve(__dirname),
    resolve: { alias },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(join(__dirname, "index.html")),
          settings: resolve(join(__dirname, "settings.html")),
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
