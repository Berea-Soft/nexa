import { defineConfig, type UserConfig } from "vite";
import { dirname, resolve } from "path";
import { existsSync, readFileSync, rmSync } from "fs";
import { fileURLToPath } from "url";
import dts from 'vite-plugin-dts'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pack = JSON.parse(
  readFileSync(resolve(__dirname, "package.json"), "utf-8"),
);

const banner = `/*! Nexa v${
  pack.version
} | (c) ${new Date().getFullYear()} Berea-Soft | MIT License | https://github.com/Berea-Soft/Nexa */`;

const distTypesSrcDir = resolve(__dirname, "dist", "types", "src");

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: false,
      insertTypesEntry: true,
      copyDtsFiles: true,
      entryRoot: resolve(__dirname, "src"),
      outDir: resolve(__dirname, "dist/types"),
      strictOutput: true,
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.spec.ts"],
      beforeWriteFile: (filePath, content) => {
        const normalizedPath = filePath.replace(
          /([\\/])dist\1types\1src(?=[\\/])/,
          "$1dist$1types",
        );
        return { filePath: normalizedPath, content };
      },
      afterBuild: () => {
        if (existsSync(distTypesSrcDir)) {
          rmSync(distTypesSrcDir, { recursive: true, force: true });
        }
      },
    }),
  ],
  checks: {
    pluginTimings: false,
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Nexa",
      formats: ["es", "cjs", "umd", "iife"],
      fileName: (format) => `nexa.${format === "cjs" ? "cjs" : format}.js`,
    },
    rollupOptions: {
      external: ['fs'],
      output: {
        banner,
      },
    },
    emptyOutDir: true,
    sourcemap: false,
    minify: "oxc",
    target: "es2024",
    reportCompressedSize: true,
  },
} as UserConfig);
