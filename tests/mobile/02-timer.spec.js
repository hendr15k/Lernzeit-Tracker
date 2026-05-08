const { test, expect } = require('@playwright/test');
const { getFileUrl } = require('../helpers');

const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 11 Pro Max', width: 414, height: 896 },
  { name: 'Samsung Galaxy S10+', width: 412, height: 869 },
];

test.describe('Timer Overlay Tests', () => {
  for (const vp of viewports) {
    test(`${vp.name} - Timer Opens`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-timer-toggle');
      await expect(page.locator('#timer-overlay')).not.toHaveClass(/translate-y-full/);
    });

    test(`${vp.name} - Timer Display Visible`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-timer-toggle');
      await expect(page.locator('#timer-display')).toBeVisible();

      const displayBox = await page.locator('#timer-display').boundingBox();
      expect(displayBox.width).toBeGreaterThan(0);
      expect(displayBox.height).toBeGreaterThan(0);

      const isFullyVisible = displayBox.y >= 0 &&
                            displayBox.y + displayBox.height <= vp.height;
      expect(isFullyVisible).toBe(true);
    });

    test(`${vp.name} - Timer Controls Visible`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-timer-toggle');

      await expect(page.locator('#btn-timer-start')).toBeVisible();
      await expect(page.locator('#btn-timer-stop')).toBeVisible();

      const startBox = await page.locator('#btn-timer-start').boundingBox();
      const stopBox = await page.locator('#btn-timer-stop').boundingBox();

      expect(startBox.y + startBox.height).toBeLessThanOrEqual(vp.height);
      expect(stopBox.y + stopBox.height).toBeLessThanOrEqual(vp.height);
    });

    test(`${vp.name} - Subject Select Visible`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-timer-toggle');
      await expect(page.locator('#timer-subject-select')).toBeVisible();
    });

    test(`${vp.name} - Topics Input Visible`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-timer-toggle');
      await expect(page.locator('#timer-topics-input')).toBeVisible();
    });

    test(`${vp.name} - Pomodoro Toggle Visible`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-timer-toggle');
      await expect(page.locator('#btn-pomodoro-toggle')).toBeVisible();
    });

    test(`${vp.name} - Notes Toggle Works`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-timer-toggle');
      await expect(page.locator('#btn-timer-notes-toggle')).toBeVisible();

      await page.click('#btn-timer-notes-toggle');
      await expect(page.locator('#timer-notes-collapsed')).toBeVisible();
    });

    test(`${vp.name} - Timer Closes`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-timer-toggle');
      await page.click('#btn-timer-close');
      await expect(page.locator('#timer-overlay')).toHaveClass(/translate-y-full/);
    });

    test(`${vp.name} - Timer Overlay No Overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-timer-toggle');

      const hasHorizontalScroll = await page.evaluate(() => {
        const overlay = document.getElementById('timer-overlay');
        return overlay.scrollWidth > overlay.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });
  }
});

test.describe('FAB Timer Tests', () => {
  for (const vp of viewports) {
    test(`${vp.name} - FAB Opens Timer`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#fab-main');
      await expect(page.locator('#timer-overlay')).not.toHaveClass(/translate-y-full/);
    });

    test(`${vp.name} - FAB Icon Changes on Timer Open`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const fabIcon = page.locator('#fab-main i');
      await expect(fabIcon).toBeVisible();

      await page.click('#fab-main');
      await expect(page.locator('#timer-overlay')).toHaveClass(/translate-y-0/);
    });
  }
});
