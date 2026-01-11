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
        // Export-only files (no logic to test)
        "src/application/index.ts",
        "src/application/ports.ts",
        "src/domain/index.ts",
        "src/domain/config.ts",
        "src/domain/types.ts",
        "src/adapters/http/context.ts",
        // Main entry point (integration tested)
        "src/index.ts",
        // JWT verifier JWKS discovery uses jose library's internal fetch which can't be mocked
        // The HS256 verification path is fully unit tested in jwt-verifier.test.ts
        "src/adapters/jwt-verifier.ts",
      ],
    },
  },
};
