import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'integration',
    include: ['src/test/integration/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
