  import { defineConfig } from '@playwright/test';

  export default defineConfig({
    testDir: './src',
    testMatch: '**/*.e2e.ts',
    use: {
      baseURL: 'http://localhost:3333',
      headless: true
    },
    webServer: {
      command: 'npx serve www -p 3333',
      port: 3333,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
  });
