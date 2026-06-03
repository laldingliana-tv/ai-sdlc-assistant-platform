import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: dirname(fileURLToPath(import.meta.url)),
    include: ['__tests__/**/*.spec.ts'],
  },
});
