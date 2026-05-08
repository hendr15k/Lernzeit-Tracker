const { test, expect } = require('@playwright/test');
const { getFileUrl } = require('../helpers');

const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 11 Pro Max', width: 414, height: 896 },
  { name: 'Samsung Galaxy S10+', width: 412, height: 869 },
];

test.describe('Heatmap Component Tests', () => {
  for (const vp of viewports) {
    test(`${vp.name} - Heatmap Container Visible`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await expect(page.locator('#heatmap-container')).toBeVisible();
      await expect(page.locator('#heatmap-grid')).toBeVisible();
    });

    test(`${vp.name} - Heatmap Has Cells`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const cells = page.locator('#heatmap-grid .heatmap-cell');
      const count = await cells.count();
      expect(count).toBeGreaterThan(0);
    });

    test(`${vp.name} - Heatmap Scrollable If Wide`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const scrollWidth = await page.evaluate(() => {
        const grid = document.getElementById('heatmap-grid');
        return grid ? grid.scrollWidth : 0;
      });

      const containerWidth = await page.evaluate(() => {
        const container = document.getElementById('heatmap-container');
        return container ? container.clientWidth : 0;
      });

      if (scrollWidth > containerWidth) {
        const overflowStyle = await page.evaluate(() => {
          const container = document.getElementById('heatmap-container');
          return window.getComputedStyle(container).overflowX;
        });
        expect(['auto', 'scroll'].includes(overflowStyle)).toBe(true);
      }
    });

    test(`${vp.name} - Heatmap Legend Visible`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const legend = page.locator('.heatmap-legend-level-0');
      await expect(legend).toBeVisible();

      const legendCount = await page.locator('[class*="heatmap-legend-level-"]').count();
      expect(legendCount).toBe(5);
    });

    test(`${vp.name} - Heatmap Summary Label`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await expect(page.locator('#heatmap-summary')).toBeVisible();
      const text = await page.locator('#heatmap-summary').textContent();
      expect(text).toContain('Wochen');
    });

    test(`${vp.name} - Heatmap Day Labels`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const labels = page.locator('#heatmap-container .text-\\[10px\\]');
      const count = await labels.count();
      expect(count).toBeGreaterThan(0);
    });
  }
});

test.describe('Heatmap Interaction Tests', () => {
  for (const vp of viewports) {
    test(`${vp.name} - Heatmap Cell Hover Effect`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const cell = page.locator('#heatmap-grid .heatmap-cell').first();
      await expect(cell).toBeVisible();

      await cell.hover();
      await page.waitForTimeout(100);
    });

    test(`${vp.name} - Heatmap Horizontal Scroll`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const grid = page.locator('#heatmap-grid');
      const scrollWidth = await grid.evaluate((el) => el.scrollWidth);
      const clientWidth = await grid.evaluate((el) => el.clientWidth);

      if (scrollWidth > clientWidth) {
        const initialScroll = await grid.evaluate((el) => el.scrollLeft);
        await grid.evaluate((el) => el.scrollBy({ left: 50, behavior: 'instant' }));
        const newScroll = await grid.evaluate((el) => el.scrollLeft);
        expect(newScroll).toBeGreaterThan(initialScroll);
      }
    });
  }
});

test.describe('Heatmap Tooltip Tests', () => {
  for (const vp of viewports) {
    test(`${vp.name} - No Tooltip Before Interaction`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const tooltip = page.locator('.heatmap-tooltip');
      const isHidden = await tooltip.isHidden();
      expect(isHidden).toBe(true);
    });

    test(`${vp.name} - Cell Data Attributes Present`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const cell = page.locator('#heatmap-grid .heatmap-cell').first();
      const hasDateAttr = await cell.getAttribute('data-date');
      expect(hasDateAttr).toBeTruthy();
    });
  }
});

test.describe('Heatmap Theme Tests', () => {
  for (const vp of viewports) {
    test(`${vp.name} - Heatmap Colors in Light Mode`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-menu');
      await page.click('#settings-theme-light');
      await page.click('#btn-settings-close');

      const cellColor = await page.evaluate(() => {
        const cell = document.querySelector('#heatmap-grid .heatmap-cell');
        return cell ? window.getComputedStyle(cell).backgroundColor : null;
      });

      expect(cellColor).toBeTruthy();
    });

    test(`${vp.name} - Heatmap Colors in Dark Mode`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      await page.click('#btn-menu');
      await page.click('#settings-theme-dark');
      await page.click('#btn-settings-close');

      const cellColor = await page.evaluate(() => {
        const cell = document.querySelector('#heatmap-grid .heatmap-cell');
        return cell ? window.getComputedStyle(cell).backgroundColor : null;
      });

      expect(cellColor).toBeTruthy();
    });

    test(`${vp.name} - Legend Level 0 Color Changes with Theme`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const legend0Light = await page.evaluate(() => {
        const el = document.querySelector('.heatmap-legend-level-0');
        return el ? window.getComputedStyle(el).backgroundColor : null;
      });

      await page.click('#btn-menu');
      await page.click('#settings-theme-dark');
      await page.click('#btn-settings-close');

      const legend0Dark = await page.evaluate(() => {
        const el = document.querySelector('.heatmap-legend-level-0');
        return el ? window.getComputedStyle(el).backgroundColor : null;
      });

      expect(legend0Light).not.toEqual(legend0Dark);
    });
  }
});
