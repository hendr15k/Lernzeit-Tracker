const { test, expect } = require('@playwright/test');
const { getFileUrl } = require('../helpers');

const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 11 Pro Max', width: 414, height: 896 },
  { name: 'Samsung Galaxy S10+', width: 412, height: 869 },
];

test.describe('Navigation Tests', () => {
  for (const vp of viewports) {
    test(`${vp.name} - Bottom Nav All Buttons Visible`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const navButtons = page.locator('.nav-btn');
      const count = await navButtons.count();
      expect(count).toBe(5);

      for (const btn of await navButtons.all()) {
        await expect(btn).toBeVisible();
      }
    });

    test(`${vp.name} - Nav to Einheiten View`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('.nav-btn[data-target="view-einheiten"]');
      await expect(page.locator('#view-einheiten')).toBeVisible();
      await expect(page.locator('#view-dashboard')).not.toBeVisible();
    });

    test(`${vp.name} - Nav to Faecher View`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('.nav-btn[data-target="view-faecher"]');
      await expect(page.locator('#view-faecher')).toBeVisible();
    });

    test(`${vp.name} - Nav to Kalender View`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('.nav-btn[data-target="view-kalender"]');
      await expect(page.locator('#view-kalender')).toBeVisible();
    });

    test(`${vp.name} - Nav to Semester View`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('.nav-btn[data-target="view-semester"]');
      await expect(page.locator('#view-semester')).toBeVisible();
    });

    test(`${vp.name} - Back to Dashboard`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('.nav-btn[data-target="view-einheiten"]');
      await page.click('.nav-btn[data-target="view-dashboard"]');
      await expect(page.locator('#view-dashboard')).toBeVisible();
    });

    test(`${vp.name} - Header Buttons Visible`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await expect(page.locator('#btn-add')).toBeVisible();
      await expect(page.locator('#btn-timer-toggle')).toBeVisible();
      await expect(page.locator('#btn-theme')).toBeVisible();
      await expect(page.locator('#btn-menu')).toBeVisible();
    });

    test(`${vp.name} - Menu Opens Settings`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-menu');
      await expect(page.locator('#settings-overlay')).not.toHaveClass(/translate-y-full/);
    });

    test(`${vp.name} - Settings Overlay Scrollable`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-menu');

      const saveButton = page.locator('#btn-settings-save');
      await expect(saveButton).toBeVisible();

      const saveBox = await saveButton.boundingBox();
      expect(saveBox.y + saveBox.height).toBeLessThanOrEqual(vp.height);
    });

    test(`${vp.name} - FAB Not Blocked by Nav`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const fab = page.locator('#fab-main');
      const nav = page.locator('nav');

      const fabBox = await fab.boundingBox();
      const navBox = await nav.boundingBox();

      expect(fabBox.y + fabBox.height).toBeLessThan(navBox.y);
    });

    test(`${vp.name} - Add Entry Overlay Opens`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-add');
      await expect(page.locator('#add-entry-overlay')).not.toHaveClass(/translate-y-full/);
    });

    test(`${vp.name} - Add Subject Overlay Opens`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.goto(getFileUrl() + '#view-faecher');
      await page.click('#btn-add-subject');
      await expect(page.locator('#add-subject-overlay')).not.toHaveClass(/translate-y-full/);
    });
  }
});

test.describe('Overlay Close Tests', () => {
  for (const vp of viewports) {
    test(`${vp.name} - Settings Close Button`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-menu');
      await page.click('#btn-settings-close');
      await expect(page.locator('#settings-overlay')).toHaveClass(/translate-y-full/);
    });

    test(`${vp.name} - Add Entry Close Button`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-add');
      await page.click('#btn-add-close');
      await expect(page.locator('#add-entry-overlay')).toHaveClass(/translate-y-full/);
    });
  }
});
