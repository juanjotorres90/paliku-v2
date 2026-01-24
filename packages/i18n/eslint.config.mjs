import { config } from "@repo/eslint-config/base";

/** @type {import("eslint").Linter.Config} */
export default [
  { ignores: ["dist/**"] },
  ...config,
  {
    files: ["src/messages.ts"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];
