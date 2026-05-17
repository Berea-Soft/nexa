import { defineConfig, type UserConfig } from "vite";
import { dirname, resolve } from "path";
import { existsSync, readFileSync, rmSync } from "fs";
import { fileURLToPath } from "url";
import dts from "vite-plugin-dts";

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
      entryRoot: "src",
      outDir: "dist/types",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/realtime/**/*",
        "src/http-client/node-http-adapter.ts",
        "src/testing/**/*",
      ],
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
