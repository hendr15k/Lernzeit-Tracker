const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', fullyParallel: true, timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4317', headless: true },
  webServer: { command: 'python3 -m http.server 4317 --bind 127.0.0.1', port: 4317, reuseExistingServer: !process.env.CI },
  reporter: 'list'
});
