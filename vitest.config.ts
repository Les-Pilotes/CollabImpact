import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "**/node_modules/**",
        "**/.next/**",
        "**/prisma/**",
        "tests/**",
        "**/*.config.*",
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
      ],
    },
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
