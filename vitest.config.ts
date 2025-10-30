import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/test.mjs'],
    exclude: ['tests/_helpers.mjs'],
    reporters: ['default'],
    watch: false,
    pool: 'threads',
  },
});
