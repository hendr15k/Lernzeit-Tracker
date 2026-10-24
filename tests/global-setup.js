'use strict';
const fs = require('fs');
const path = require('path');
const { request } = require('@playwright/test');

module.exports = async (config) => {
  const statePath = path.join(__dirname, '..', 'test-results', 'auth.json');
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  const baseURL = config.projects[0].use.baseURL;
  const context = await request.newContext({ baseURL });
  const login = await context.post('/api/login', {
    data: { username: 'hendrik', password: 'test-password' }
  });
  if (!login.ok()) {
    throw new Error(`Test login failed with ${login.status()}`);
  }
  // Every run starts from an empty account so assertions are deterministic.
  const reset = await context.delete('/api/data');
  if (!reset.ok()) throw new Error(`Test reset failed with ${reset.status()}`);
  await context.storageState({ path: statePath });
  await context.dispose();
};
