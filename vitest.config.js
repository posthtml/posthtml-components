import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['docs-src/*', 'scripts/*'],
    include: ['test/**/test*.js'],
    coverage: {
      exclude: [
        'docs-src/*',
        'scripts/*',
        'vitest.config.js',
        'test/templates/*'
      ],
    }
  },
});
