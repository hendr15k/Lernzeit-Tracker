const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: `file://${path.resolve(__dirname)}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'chromium-mobile-small',
      use: {
        viewport: { width: 360, height: 640 },
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36',
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'chromium-mobile-large',
      use: {
        viewport: { width: 414, height: 896 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});
