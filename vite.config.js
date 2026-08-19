import { cp, copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const sourceDirectory = resolve("src");
const outputDirectory = resolve("dist");

const copyStaticAssets = () => ({
  name: "copy-static-assets",
  async closeBundle() {
    await mkdir(outputDirectory, { recursive: true });
    await cp(
      resolve(sourceDirectory, "images"),
      resolve(outputDirectory, "images"),
      { recursive: true },
    );
    await Promise.all(
      ["manifest.json", "robots.txt"].map((fileName) =>
        copyFile(
          resolve(sourceDirectory, fileName),
          resolve(outputDirectory, fileName),
        ),
      ),
    );
  },
});

export default defineConfig({
  root: sourceDirectory,
  base: "./",
  publicDir: false,
  plugins: [copyStaticAssets()],
  build: {
    outDir: outputDirectory,
    emptyOutDir: true,
  },
});
