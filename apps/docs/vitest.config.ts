import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("./", import.meta.url));
const uiRoot = fileURLToPath(new URL("../../packages/ui/src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: `${appRoot}$1` },
      { find: /^@repo\/ui\/(.*)$/, replacement: `${uiRoot}/$1` },
      { find: "@repo/ui", replacement: uiRoot },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "**/*.test.{ts,tsx}",
        "**/*.config.{ts,js}",
        "**/vitest.setup.ts",
        "**/.next/**",
        "**/dist/**",
      ],
    },
  },
});
