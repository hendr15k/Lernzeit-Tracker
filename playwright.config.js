const { defineConfig } = require('@playwright/test');
const path = require('path');

const root = __dirname;
const dataDir = path.join(root, 'test-results', 'data');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  globalSetup: './tests/global-setup.js',
  use: {
    baseURL: 'http://127.0.0.1:4317',
    headless: true,
    storageState: path.join(root, 'test-results', 'auth.json')
  },
  webServer: {
    command: 'node server/server.js',
    port: 4317,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: '4317',
      HOST: '127.0.0.1',
      STATIC_DIR: root,
      DATA_DIR: dataDir,
      AUTH_USER: 'hendrik',
      AUTH_PASSWORD: 'test-password',
      AUTH_SECRET: 'test-secret-0123456789abcdef0123456789'
    }
  },
  reporter: 'list'
});
