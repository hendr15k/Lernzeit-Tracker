const { test, expect } = require('@playwright/test');

test.use({ storageState: { cookies: [], origins: [] } });

test('unauthenticated visitor sees the login gate and not the app', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('#auth-gate')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#auth-submit')).toBeVisible();
  await expect(page.locator('#main-content')).toBeHidden();
  await expect(page.locator('#workspace-sidebar')).toBeHidden();
});

test('wrong password stays on the gate with an error', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#auth-gate')).toBeVisible({ timeout: 10000 });
  await page.locator('#auth-username').fill('hendrik');
  await page.locator('#auth-password').fill('definitely-wrong');
  await page.locator('#auth-submit').click();
  await expect(page.locator('#auth-status')).toContainText('falsch', { timeout: 5000 });
  await expect(page.locator('#main-content')).toBeHidden();
});

test('login opens the workspace and logout returns to the gate', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('#auth-gate')).toBeVisible({ timeout: 10000 });
  await page.locator('#auth-username').fill('hendrik');
  await page.locator('#auth-password').fill('test-password');
  await page.locator('#auth-submit').click();
  await expect(page.locator('#btn-hero-start')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#auth-gate')).toBeHidden();
  await expect(page.locator('#main-content')).toBeVisible();
  await page.locator('[data-action="logout"]').first().click();
  await expect(page.locator('#auth-gate')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#main-content')).toBeHidden();
});


test('account data is stored on the server and survives a fresh browser context', async ({ browser, request }) => {
  const login = await request.post('/api/login', { data: { username: 'hendrik', password: 'test-password' } });
  expect(login.ok()).toBe(true);
  const reset = await request.delete('/api/data');
  expect(reset.ok()).toBe(true);
  const resetBody = await reset.json();
  const stored = JSON.stringify([{ id: 'server-proof', subjectId: 'sem3-messtechnik', duration: 600, startTime: new Date().toISOString(), endTime: new Date().toISOString(), notes: 'vom Server', topics: '' }]);
  const put = await request.put('/api/data', { data: { data: { lernzeit_entries: stored }, baseRevision: resetBody.revision } });
  expect(put.ok()).toBe(true);

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#auth-gate')).toBeVisible({ timeout: 10000 });
  await page.locator('#auth-username').fill('hendrik');
  await page.locator('#auth-password').fill('test-password');
  await page.locator('#auth-submit').click();
  await expect(page.locator('#btn-hero-start')).toBeVisible({ timeout: 10000 });
  const local = await page.evaluate(() => JSON.parse(localStorage.getItem('lernzeit_entries') || '[]'));
  expect(local.some((entry) => entry.id === 'server-proof')).toBe(true);
  await context.close();
  await request.delete('/api/data');
});
