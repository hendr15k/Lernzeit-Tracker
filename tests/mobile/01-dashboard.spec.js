const { test, expect } = require('@playwright/test');
const { getFileUrl } = require('../helpers');

const vp = { name: 'iPhone 12', width: 390, height: 844 };

test.describe('Dashboard Widget Tests', () => {
  test(`${vp.name} - Dashboard Widgets Load`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await expect(page.locator('#view-dashboard')).toBeVisible();
    await expect(page.locator('#daily-goal-ring')).toBeVisible();
    await expect(page.locator('#dashboard-graph')).toBeVisible();
    await expect(page.locator('#heatmap-container')).toBeVisible();
    await expect(page.locator('#achievements-list')).toBeVisible();
  });

  test(`${vp.name} - Daily Goal Ring Visible`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    const ring = page.locator('#daily-goal-ring');
    await expect(ring).toBeVisible();

    const ringBox = await ring.boundingBox();
    expect(ringBox.width).toBeGreaterThan(0);
    expect(ringBox.height).toBeGreaterThan(0);
  });

  test(`${vp.name} - Weekly Graph Bars Visible`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    const graph = page.locator('#dashboard-graph');
    await expect(graph).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test(`${vp.name} - Heatmap Container Scrollable`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    const heatmap = page.locator('#heatmap-container');
    await expect(heatmap).toBeVisible();

    const heatmapBox = await heatmap.boundingBox();
    const scrollWidth = await heatmap.evaluate((el) => el.scrollWidth);
    const clientWidth = await heatmap.evaluate((el) => el.clientWidth);

    if (scrollWidth > clientWidth) {
      const scrollIndicator = await page.evaluate(() => {
        const el = document.getElementById('heatmap-container');
        const style = window.getComputedStyle(el);
        return style.overflowX !== 'hidden';
      });
      expect(scrollIndicator).toBe(true);
    }
  });

  test(`${vp.name} - Achievements Grid Layout`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    const achievements = page.locator('#achievements-list');
    await expect(achievements).toBeVisible();

    const children = await achievements.locator('> *').count();
    expect(children).toBeGreaterThan(0);
  });

  test(`${vp.name} - Streak Widget Visible`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await expect(page.locator('#dashboard-streak')).toBeVisible();
    await expect(page.locator('#dashboard-total')).toBeVisible();
  });

  test(`${vp.name} - Exam Countdown Widget Visible`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await expect(page.locator('#exam-countdown-list')).toBeVisible();
  });

  test(`${vp.name} - Weekly Stats Widget Visible`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await expect(page.locator('#weekly-bar-chart')).toBeVisible();
    await expect(page.locator('#weekly-total')).toBeVisible();
  });

  test(`${vp.name} - Lern-Trends Widget Visible`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await expect(page.locator('#trend-best-time')).toBeVisible();
    await expect(page.locator('#trend-avg-session')).toBeVisible();
    await expect(page.locator('#trend-direction')).toBeVisible();
  });

  test(`${vp.name} - Subject Tiles Widget Visible`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    await expect(page.locator('#dashboard-subject-tiles')).toBeVisible();
  });

  test(`${vp.name} - No Widget Overlap`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(getFileUrl());

    const widgets = await page.evaluate(() => {
      const dashboard = document.getElementById('view-dashboard');
      const grid = dashboard.querySelector('.grid');
      if (!grid) return [];

      const cards = Array.from(grid.querySelectorAll('.surface-card'));
      return cards.map(card => {
        const rect = card.getBoundingClientRect();
        return {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right
        };
      });
    });

    for (let i = 0; i < widgets.length; i++) {
      for (let j = i + 1; j < widgets.length; j++) {
        const overlap = !(
          widgets[i].bottom <= widgets[j].top ||
          widgets[i].top >= widgets[j].bottom ||
          widgets[i].right <= widgets[j].left ||
          widgets[i].left >= widgets[j].right
        );

        const withinTolerance = Math.abs(widgets[i].bottom - widgets[j].top) < 10;
        expect(overlap && !withinTolerance).toBe(false);
      }
    }
  });
});
