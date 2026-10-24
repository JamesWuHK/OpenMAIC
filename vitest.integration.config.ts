import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Diagnostic source aliases for an isolated checkout that still shares an
// older node_modules tree. These tests do not replace a package build or the
// normal suite with freshly installed workspace dependencies.
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^htmlparser2$/,
        replacement: resolve(
          __dirname,
          'node_modules/.pnpm/htmlparser2@8.0.2/node_modules/htmlparser2/lib/index.js',
        ),
      },
      {
        find: /^@openmaic\/generation\/(.+)$/,
        replacement: resolve(__dirname, 'packages/@openmaic/generation/src/$1.ts'),
      },
      {
        find: /^@openmaic\/generation$/,
        replacement: resolve(__dirname, 'packages/@openmaic/generation/src/index.ts'),
      },
      {
        find: /^@openmaic\/storage\/server$/,
        replacement: resolve(__dirname, 'packages/@openmaic/storage/src/server/index.ts'),
      },
      {
        find: /^@openmaic\/storage\/(.+)$/,
        replacement: resolve(__dirname, 'packages/@openmaic/storage/src/$1.ts'),
      },
      {
        find: /^@openmaic\/storage$/,
        replacement: resolve(__dirname, 'packages/@openmaic/storage/src/index.ts'),
      },
      {
        find: /^@openmaic\/dsl$/,
        replacement: resolve(__dirname, 'packages/@openmaic/dsl/src/index.ts'),
      },
      { find: /^@\//, replacement: `${resolve(__dirname, '.')}/` },
    ],
  },
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup-env.ts'],
  },
});
