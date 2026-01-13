import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'test/**/*.test.ts',
      'test/**/*.test.js',
      'backend/**/*.test.ts',
      'backend/**/*.test.js'
    ],
    exclude: [
      'node_modules',
      'dist',
      'frontend',
      '**/*.bak.js'
    ],
    hookTimeout: 30000,
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './backend')
    }
  }
});
