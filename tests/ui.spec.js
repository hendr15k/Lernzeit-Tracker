const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.request.delete('/api/data');
});

async function flushSync(page) {
  await page.evaluate(async () => { if (window.lernzeitAuth) await window.lernzeitAuth.syncNow(); });
  await page.waitForTimeout(150);
}

test('desktop workspace has a full-height sidebar and a wide dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toBeVisible();
  const sidebar = await page.locator('#workspace-sidebar').boundingBox();
  expect(sidebar.x).toBe(0);
  expect(sidebar.height).toBe(1000);
  expect((await page.locator('#main-content').boundingBox()).width).toBeGreaterThan(900);
  await expect(page.getByRole('button', { name: 'Lernsession starten', exact: true })).toBeVisible();
  expect(await page.locator('#workspace-sidebar .nav-btn').count()).toBe(9);
});

const VIEW_IDS = [
  'view-dashboard',
  'view-einheiten',
  'view-faecher',
  'view-kalender',
  'view-achievements',
  'view-pruefungen',
  'view-semester',
  'view-statistiken',
  'view-ziele',
];

async function localTodayDateInput(page) {
  return page.evaluate(() => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  });
}

async function localPastTimeInput(page, minutesAgo = 90) {
  return page.evaluate((ago) => {
    const d = new Date(Date.now() - ago * 60 * 1000);
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  }, minutesAgo);
}

test('mobile bottom nav shows core destinations and more-button opens drawer with all views', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const bottomNav = page.locator('.mobile-bottom-nav');
  await expect(bottomNav).toBeVisible();
  for (const target of ['view-dashboard', 'view-einheiten', 'view-kalender']) {
    await expect(page.locator(`.mobile-bottom-nav .nav-btn[data-target="${target}"]`)).toBeVisible();
  }
  const moreBtn = page.locator('#btn-more-nav');
  await expect(moreBtn).toBeVisible();
  await moreBtn.click();
  await expect(page.locator('#workspace-sidebar.is-open')).toBeVisible({ timeout: 5000 });
  for (const target of VIEW_IDS) {
    // Drawer closes after each nav click on mobile, so reopen it first.
    if (!(await page.locator('#workspace-sidebar.is-open').count())) {
      await page.locator('#btn-more-nav').click();
      await expect(page.locator('#workspace-sidebar.is-open')).toBeVisible({ timeout: 5000 });
    }
    // Duplicates exist (sidebar + bottom nav): target the first visible match.
    const btn = page.locator(`.nav-btn[data-target="${target}"]`).filter({ hasNot: page.locator('.hidden') }).first();
    await btn.click();
    await expect(page.locator(`#${target}`)).toBeVisible({ timeout: 5000 });
  }
});

test('manual add-entry via overlay persists to localStorage and survives reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#btn-hero-start')).toBeVisible({ timeout: 10000 });
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('lernzeit_entries') || '[]').length);
  await page.locator('#btn-add').click();
  await expect(page.locator('#add-entry-overlay:not(.translate-y-full)')).toBeVisible({ timeout: 5000 });
  const subjectValue = await page.locator('#add-subject-select').evaluate((sel) => {
    const opts = Array.from(sel.options).filter((o) => o.value);
    return opts.length ? opts[0].value : '';
  });
  expect(subjectValue).not.toBe('');
  await page.locator('#add-subject-select').selectOption(subjectValue);
  await page.locator('#add-date-input').fill(await localTodayDateInput(page));
  await page.locator('#add-time-input').fill(await localPastTimeInput(page, 90));
  await page.locator('#add-duration-input').fill('45');
  await page.locator('#add-notes-input').fill('pw-e2e-manual');
  await page.locator('#btn-add-save').click();
  await expect(page.locator('#add-entry-overlay.translate-y-full')).toBeAttached({ timeout: 5000 });
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('lernzeit_entries') || '[]').length), { timeout: 5000 }).toBe(before + 1);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lernzeit_entries') || '[]').pop());
  expect(saved.duration).toBe(45 * 60);
  expect(String(saved.notes || '')).toContain('pw-e2e-manual');
  await flushSync(page);
  await page.reload();
  await expect(page.locator('#btn-hero-start')).toBeVisible({ timeout: 10000 });
  const afterReload = await page.evaluate(() => JSON.parse(localStorage.getItem('lernzeit_entries') || '[]'));
  expect(afterReload.length).toBe(before + 1);
  expect(String(afterReload[afterReload.length - 1].notes || '')).toContain('pw-e2e-manual');
});

test('theme toggle switches theme and persists across reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('#btn-theme')).toBeVisible({ timeout: 10000 });
  const initial = await page.evaluate(() => ({
    htmlClass: document.documentElement.className,
    mode: (() => { try { return JSON.parse(localStorage.getItem('lernzeit_settings') || '{}').themeMode || null; } catch { return null; } })(),
  }));
  await page.locator('#btn-theme').click();
  await page.waitForTimeout(400);
  const toggled = await page.evaluate(() => ({
    htmlClass: document.documentElement.className,
    mode: (() => { try { return JSON.parse(localStorage.getItem('lernzeit_settings') || '{}').themeMode || null; } catch { return null; } })(),
    dark: document.documentElement.classList.contains('dark'),
    light: document.documentElement.classList.contains('light'),
  }));
  expect(toggled.mode !== initial.mode || toggled.htmlClass !== initial.htmlClass).toBe(true);
  expect(toggled.dark !== toggled.light || toggled.dark === true || toggled.light === true).toBe(true);
  await page.reload();
  await expect(page.locator('#btn-theme')).toBeVisible({ timeout: 10000 });
  const persisted = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('lernzeit_settings') || '{}').themeMode || null; } catch { return null; }
  });
  expect(persisted).toBe(toggled.mode);
});

test('hero start opens timer; timer start/pause/save stores an entry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#btn-hero-start')).toBeVisible({ timeout: 10000 });
  await page.locator('#btn-hero-start').click();
  await expect(page.locator('#timer-overlay:not(.translate-y-full)')).toBeVisible({ timeout: 5000 });
  await page.locator('#btn-timer-close').click();
  await expect(page.locator('#timer-overlay.translate-y-full')).toBeAttached({ timeout: 5000 });

  await page.locator('#btn-timer-toggle').click();
  await expect(page.locator('#timer-overlay:not(.translate-y-full)')).toBeVisible({ timeout: 5000 });
  const subjectValue = await page.locator('#timer-subject-select').evaluate((sel) => {
    const opts = Array.from(sel.options).filter((o) => o.value);
    return opts.length ? opts[0].value : '';
  });
  expect(subjectValue).not.toBe('');
  await page.locator('#timer-subject-select').selectOption(subjectValue);
  const countBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('lernzeit_entries') || '[]').length);
  await page.locator('#btn-timer-start').click();
  await expect(page.locator('#btn-timer-pause')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(2300);
  const display = (await page.locator('#timer-display').textContent()) || '';
  expect(display.trim()).not.toBe('00:00:00');
  expect(display.trim()).not.toBe('00:00');
  await page.locator('#btn-timer-pause').click();
  await expect(page.locator('#btn-timer-start')).toBeVisible({ timeout: 5000 });
  await page.locator('#btn-timer-save').click();
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('lernzeit_entries') || '[]').length), { timeout: 5000 }).toBe(countBefore + 1);
  const entry = await page.evaluate(() => JSON.parse(localStorage.getItem('lernzeit_entries') || '[]').pop());
  expect(Number(entry.duration)).toBeGreaterThan(0);
  expect(Number.isFinite(new Date(entry.startTime).getTime())).toBe(true);
});

test('hero today total counts ISO-date entries for today only and survives reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('#hero-today-minutes')).toBeVisible({ timeout: 10000 });
  await page.evaluate(() => {
    const now = new Date();
    const at = (h, dOff = 0) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dOff, h, 0, 0, 0);
      return d.toISOString();
    };
    const entries = [
      { id: 'iso-today-1', subjectId: '1', duration: 1800, startTime: at(10, 0), endTime: at(10, 0), notes: 'iso-a', topics: '' },
      { id: 'iso-today-2', subjectId: '1', duration: 1800, startTime: at(12, 0), endTime: at(12, 0), notes: 'iso-b', topics: '' },
      { id: 'iso-yesterday', subjectId: '1', duration: 3600, startTime: at(10, -1), endTime: at(10, -1), notes: 'iso-old', topics: '' },
    ];
    localStorage.setItem('lernzeit_entries', JSON.stringify(entries));
  });
  await page.reload();
  const hero = page.locator('#hero-today-minutes');
  await expect(hero).toBeVisible({ timeout: 10000 });
  await expect.poll(async () => (await hero.textContent() || '').trim(), { timeout: 8000 }).not.toBe('0m');
  await expect(hero).toHaveText('1h', { timeout: 8000 });
  await page.reload();
  await expect(page.locator('#hero-today-minutes')).toHaveText('1h', { timeout: 8000 });
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('lernzeit_entries') || '[]'));
  expect(stored.length).toBe(3);
  expect(stored.filter((e) => String(e.id).startsWith('iso-today')).length).toBe(2);
});

test('no duplicate ids and no uncaught script errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err && err.message ? err.message : err)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('#btn-hero-start')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(1200);
  const duplicates = await page.evaluate(() => {
    const seen = new Map();
    const dups = [];
    document.querySelectorAll('[id]').forEach((el) => {
      const id = el.getAttribute('id');
      if (!id) return;
      seen.set(id, (seen.get(id) || 0) + 1);
      if (seen.get(id) === 2) dups.push(id);
    });
    return dups;
  });
  expect(duplicates).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('service worker serves the login shell offline', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('#btn-hero-start')).toBeVisible({ timeout: 10000 });
  const swState = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { supported: false };
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, rej) => setTimeout(() => rej(new Error('sw-timeout')), 15000)),
      ]);
      return { supported: true, ready: !!reg, controller: !!navigator.serviceWorker.controller, scope: reg.scope || '' };
    } catch (e) {
      return { supported: true, ready: false, error: String(e && e.message ? e.message : e) };
    }
  });
  expect(swState.supported).toBe(true);
  const swRes = await page.request.get('./sw.js').catch(() => null);
  expect(swRes === null || swRes.ok()).toBe(true);
  expect(swState.ready).toBe(true);
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    // Server-side accounts require a reachable API for authentication. The
    // cached shell must still boot and show the gate instead of a blank page.
    await expect(page.locator('#auth-gate')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#view-dashboard')).toBeAttached({ timeout: 15000 });
  } finally {
    await context.setOffline(false);
  }
});
