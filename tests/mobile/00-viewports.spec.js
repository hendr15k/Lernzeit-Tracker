const { test, expect } = require('@playwright/test');
const { getFileUrl } = require('../helpers');

const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 11 Pro Max', width: 414, height: 896 },
  { name: 'Samsung Galaxy S10+', width: 412, height: 869 },
];

test.describe('Viewport Responsive Tests', () => {
  for (const vp of viewports) {
    test(`${vp.name} (${vp.width}x${vp.height}) - Basic Layout`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('#view-dashboard')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const windowWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 5);
    });

    test(`${vp.name} - No Horizontal Overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });

    test(`${vp.name} - Bottom Navigation Visible`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      const navBox = await nav.boundingBox();
      expect(navBox.y + navBox.height).toBeLessThanOrEqual(vp.height);
    });

    test(`${vp.name} - FAB Position Correct`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const fab = page.locator('#fab-main');
      await expect(fab).toBeVisible();

      const fabBox = await fab.boundingBox();
      expect(fabBox.x).toBeGreaterThanOrEqual(0);
      expect(fabBox.x + fabBox.width).toBeLessThanOrEqual(vp.width);
    });

    test(`${vp.name} - Safe Area Padding Applied`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const nav = page.locator('nav');
      const paddingInfo = await nav.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const paddingBottom = parseFloat(style.paddingBottom);
        return {
          paddingBottom: isNaN(paddingBottom) ? 0 : paddingBottom,
          classList: Array.from(el.classList),
          hasSafeAreaClass: Array.from(el.classList).includes('pb-safe')
        };
      });
      expect(paddingInfo.hasSafeAreaClass).toBe(true);
    });
  }
});
