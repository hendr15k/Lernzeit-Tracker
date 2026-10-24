const { test, expect } = require('@playwright/test');

const EXPECTED = [
  { id: 'sem3-signal', name: 'Angewandte Leitungs- und Signaltheorie', code: '53104' },
  { id: 'sem3-messtechnik', name: 'Elektrische Messtechnik', code: '53101' },
  { id: 'sem3-numerik', name: 'Numerische Mathematik', code: '53112' },
  { id: 'sem3-regelung', name: 'Grundlagen der Regelungstechnik', code: '53113' },
];

test.beforeEach(async ({ page }) => {
  await page.request.delete('/api/data');
});

async function flushSync(page) {
  await page.evaluate(async () => { if (window.lernzeitAuth) await window.lernzeitAuth.syncNow(); });
  await page.waitForTimeout(150);
}

test('exactly the four third-semester modules are present', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('#btn-hero-start')).toBeVisible({ timeout: 10000 });
  const data = await page.evaluate(() => ({
    subjects: JSON.parse(localStorage.getItem('lernzeit_subjects') || '[]'),
    semesters: JSON.parse(localStorage.getItem('lernzeit_semesters') || '[]'),
  }));
  expect(data.subjects.map((s) => s.name).sort()).toEqual(EXPECTED.map((s) => s.name).sort());
  expect(data.subjects.find((s) => s.name === 'Elektrische Messtechnik').id).toBe('sem3-messtechnik');
  expect(data.semesters.length).toBe(1);
  expect(data.semesters[0].id).toBe('sem3-ws2627');
  expect(data.semesters[0].modules.map((m) => m.code).sort()).toEqual(['53101', '53104', '53112', '53113']);
});

test('stored third-semester sessions stay untouched and old ids are gone', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('lernzeit_entries', JSON.stringify([
      { id: 'keep-sem3', subjectId: 'sem3-messtechnik', duration: 1800, startTime: new Date().toISOString(), endTime: new Date().toISOString(), notes: 'altes messtechnik', topics: '' },
      { id: 'keep-legacy', subjectId: '2', duration: 900, startTime: new Date().toISOString(), endTime: new Date().toISOString(), notes: 'frühere notiz', topics: '' },
    ]));
  });
  await flushSync(page);
  await page.reload();
  await expect(page.locator('#btn-hero-start')).toBeVisible({ timeout: 10000 });
  const data = await page.evaluate(() => ({
    subjects: JSON.parse(localStorage.getItem('lernzeit_subjects') || '[]'),
    semesters: JSON.parse(localStorage.getItem('lernzeit_semesters') || '[]'),
    entries: JSON.parse(localStorage.getItem('lernzeit_entries') || '[]'),
  }));
  expect(data.subjects.length).toBe(4);
  expect(data.subjects.some((s) => String(s.id) === '2')).toBe(false);
  expect(data.semesters.length).toBe(1);
  expect(data.entries.length).toBe(2);
  expect(data.entries.find((e) => e.id === 'keep-sem3').subjectId).toBe('sem3-messtechnik');
  await page.locator('[data-target="view-faecher"]').first().click();
  await expect(page.locator('#view-faecher')).toBeVisible({ timeout: 5000 });
  const names = await page.locator('#view-faecher').textContent();
  expect(names).toContain('Elektrische Messtechnik');
  expect(names).not.toContain('Programmierung');
});
