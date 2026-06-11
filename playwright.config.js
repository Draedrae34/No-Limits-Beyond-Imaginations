import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.js'],
  timeout: 120000,
  retries: 0,
  reporter: [['list']],
  use: {
    headless: true,
  },
});



