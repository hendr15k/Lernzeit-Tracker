const { test, expect } = require('@playwright/test');
const { getFileUrl } = require('../helpers');

const vp = { name: 'iPhone 12', width: 390, height: 844 };

test.describe('Theme Mode Tests', () => {
  test(`${vp.name} - Dark Mode Toggle`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await page.click('#btn-menu');
    await page.click('#settings-theme-dark');

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    expect(bgColor).toBe('rgb(15, 15, 17)');
  });

  test(`${vp.name} - Light Mode Toggle`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await page.click('#btn-menu');
    await page.click('#settings-theme-light');

    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);
  });

  test(`${vp.name} - Light Mode Readable`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await page.click('#btn-menu');
    await page.click('#settings-theme-light');

    const widgets = await page.evaluate(() => {
      const cards = document.querySelectorAll('.surface-card');
      return Array.from(cards).slice(0, 5).map(card => {
        const style = window.getComputedStyle(card);
        return {
          visible: style.display !== 'none',
          hasText: card.textContent.trim().length > 0
        };
      });
    });

    expect(widgets.length).toBeGreaterThan(0);
    widgets.forEach(widget => {
      expect(widget.visible).toBe(true);
      expect(widget.hasText).toBe(true);
    });
  });

  test(`${vp.name} - Dark Mode Readable`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await page.click('#btn-menu');
    await page.click('#settings-theme-dark');

    const textColors = await page.evaluate(() => {
      const textElements = document.querySelectorAll('.text-adaptive, .text-adaptive-muted');
      return Array.from(textElements).slice(0, 5).map(el => {
        return window.getComputedStyle(el).color;
      });
    });

    expect(textColors.length).toBeGreaterThan(0);
    textColors.forEach(color => {
      expect(color).toBeTruthy();
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
    });
  });

  test(`${vp.name} - Theme Persists on Navigation`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await page.click('#btn-menu');
    await page.click('#settings-theme-dark');
    await page.click('#btn-settings-close');

    await page.click('.nav-btn[data-target="view-einheiten"]');
    await page.click('.nav-btn[data-target="view-dashboard"]');

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test(`${vp.name} - Heatmap Legend Colors in Light Mode`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await page.click('#btn-menu');
    await page.click('#settings-theme-light');
    await page.click('#btn-settings-close');

    const legendItems = page.locator('.heatmap-legend-level-0, .heatmap-legend-level-4');
    await expect(legendItems.first()).toBeVisible();
  });

  test(`${vp.name} - Heatmap Legend Colors in Dark Mode`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await page.click('#btn-menu');
    await page.click('#settings-theme-dark');
    await page.click('#btn-settings-close');

    const legendItems = page.locator('.heatmap-legend-level-0, .heatmap-legend-level-4');
    await expect(legendItems.first()).toBeVisible();
  });
});

test.describe('Input Styling Tests', () => {
  test(`${vp.name} - Input Fields Visible in Light Mode`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await page.click('#btn-menu');
    await page.click('#settings-theme-light');

    const inputs = page.locator('#settings-overlay input[type="number"], #settings-overlay input[type="text"], #settings-overlay select');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const input = inputs.nth(i);
      await expect(input).toBeVisible();
    }
  });

  test(`${vp.name} - Input Fields Visible in Dark Mode`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await page.click('#btn-menu');
    await page.click('#settings-theme-dark');

    const inputs = page.locator('#settings-overlay input[type="number"], #settings-overlay input[type="text"], #settings-overlay select');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const input = inputs.nth(i);
      await expect(input).toBeVisible();
    }
  });
});
