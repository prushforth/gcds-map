import { defineConfig, expect } from '@playwright/test';
import { matchers } from '@stencil/playwright';

expect.extend(matchers);

export default defineConfig({
  testDir: './src',
  testMatch: '*.e2e.ts',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3333/',
  },
  webServer: {
    command: 'npx http-server . -p 3333 --cors -c-1',
    port: 3333,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
