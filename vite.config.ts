import { defineConfig, type UserConfig } from "vite";
import { dirname, resolve } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pack = JSON.parse(
  readFileSync(resolve(__dirname, "package.json"), "utf-8"),
);

const banner = `/*! Nexa v${
  pack.version
} | (c) ${new Date().getFullYear()} Berea-Soft | MIT License | https://github.com/Berea-Soft/Nexa */`;

export default defineConfig({
  plugins: [],
  checks: {
    pluginTimings: false,
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Nexa",
      fileName: (format) => `nexa.${format === "cjs" ? "cjs" : format}.js`,
      formats: ["es", "cjs", "umd", "iife"],
    },
    rollupOptions: {
      external: ['fs', 'fs/promises', 'path', 'http', 'https', 'http2', 'ws'],
      output: {
        banner,
        exports: "named" as const,
        inlineDynamicImports: true,
      },
    },
    codeSplitting: false,
    emptyOutDir: false,
    sourcemap: true,
    minify: "oxc",
    reportCompressedSize: true,
  },
} as UserConfig);
