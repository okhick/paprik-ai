import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/**', 'dist/**', 'test/**', '**/*.config.*', '**/*.d.ts'],
    },
    // CRITICAL: Required for oclif CLI testing
    disableConsoleIntercept: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
