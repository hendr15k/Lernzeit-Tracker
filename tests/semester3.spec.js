const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.request.delete('/api/data');
});

async function flushSync(page) {
  await page.evaluate(async () => { if (window.lernzeitAuth) await window.lernzeitAuth.syncNow(); });
  await page.waitForTimeout(150);
}

const EXPECTED = [
  { id: 'sem3-signal', name: 'Angewandte Leitungs- und Signaltheorie', code: '53104' },
  { id: 'sem3-messtechnik', name: 'Elektrische Messtechnik', code: '53101' },
  { id: 'sem3-numerik', name: 'Numerische Mathematik', code: '53112' },
  { id: 'sem3-regelung', name: 'Grundlagen der Regelungstechnik', code: '53113' },
];

const OLD_SUBJECTS = [
  { id: '1', name: 'Höhere Mathematik 2', color: 'bg-blue-500' },
  { id: '2', name: 'GET2', color: 'bg-green-500' },
  { id: '3', name: 'Physik', color: 'bg-purple-500' },
];

test('fresh install seeds exactly the four third-semester modules', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
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

test('existing install migrates to semester 3 and keeps old sessions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.evaluate(({ olds }) => {
    localStorage.clear();
    localStorage.setItem('lernzeit_subjects', JSON.stringify(olds));
    localStorage.setItem('lernzeit_semesters', JSON.stringify([{ id: 'old', name: '2. Semester', start: '2026-04-01', end: '2026-09-30', modules: [] }]));
    localStorage.setItem('lernzeit_entries', JSON.stringify([
      { id: 'keep-get2', subjectId: '2', subjectName: 'GET2', duration: 1800, startTime: new Date().toISOString(), endTime: new Date().toISOString(), notes: 'altes messtechnik', topics: '' },
      { id: 'keep-hm2', subjectId: '1', subjectName: 'Höhere Mathematik 2', duration: 900, startTime: new Date().toISOString(), endTime: new Date().toISOString(), notes: 'alte signaltheorie', topics: '' },
    ]));
  }, { olds: OLD_SUBJECTS });
  await page.reload();
  await expect(page.locator('#btn-hero-start')).toBeVisible({ timeout: 10000 });
  const data = await page.evaluate(() => ({
    subjects: JSON.parse(localStorage.getItem('lernzeit_subjects') || '[]'),
    semesters: JSON.parse(localStorage.getItem('lernzeit_semesters') || '[]'),
    entries: JSON.parse(localStorage.getItem('lernzeit_entries') || '[]'),
  }));
  expect(data.subjects.length).toBe(4);
  expect(data.semesters.length).toBe(1);
  expect(data.entries.length).toBe(2);
  expect(data.entries.map((e) => e.subjectName).sort()).toEqual(['GET2', 'Höhere Mathematik 2']);
  expect(data.entries.every((e) => e.subjectId === null)).toBe(true);
  for (const mod of EXPECTED) {
    await expect(page.locator(`#view-faecher:has-text("${mod.name}")`)).toBeAttached();
  }
  await page.locator('[data-target="view-faecher"]').first().click();
  await expect(page.locator('#view-faecher')).toBeVisible({ timeout: 5000 });
  const names = await page.locator('#view-faecher').textContent();
  expect(names).toContain('Elektrische Messtechnik');
  expect(names).not.toContain('Programmierung');

  // The catalog migration is one-time: a subject added afterwards must survive reloads.
  await page.evaluate(() => {
    const subjects = JSON.parse(localStorage.getItem('lernzeit_subjects') || '[]');
    subjects.push({ id: 'eigene-1', name: 'Eigenes Fach', color: 'bg-teal-500', weeklyGoal: 2 });
    localStorage.setItem('lernzeit_subjects', JSON.stringify(subjects));
  });
  await flushSync(page);
  await page.reload();
  await expect(page.locator('#btn-hero-start')).toBeVisible({ timeout: 10000 });
  const custom = await page.evaluate(() => JSON.parse(localStorage.getItem('lernzeit_subjects') || '[]').some((s) => s.name === 'Eigenes Fach'));
  expect(custom).toBe(true);
});
