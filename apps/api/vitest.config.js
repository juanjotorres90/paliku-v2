export default {
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "**/*.test.ts",
        "**/*.config.{ts,js}",
        "**/dist/**",
      ],
    },
  },
};
