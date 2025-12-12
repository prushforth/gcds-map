import { test, expect, chromium } from '@playwright/test';

test.describe('Playwright StaticTile Layer Tests - Inline', () => {
  let page;
  let context;
  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('');
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    await page.goto('/test/map-layer/staticTileLayer.html', { waitUntil: 'networkidle' });
  });

  test.afterAll(async function () {
    await context.close();
  });

  test('Correct tiles render on initial map zoom level', async () => {
    await expect(async () => {
      const renderedTiles = await page.locator('map-tile[zoom="2"]');
      await expect(renderedTiles).toHaveCount(3);

      const tiles = await page.locator('map-tile[zoom="2"]').all();
      for (const tile of tiles) {
        const isRendered = await tile.evaluate(
          (t: any) => t._tileDiv !== undefined
        );
        expect(isRendered).toBe(true);
      }
    }).toPass({ timeout: 15000 });

    const nonRenderedTiles = await page.locator('map-tile[zoom="3"]');
    await expect(nonRenderedTiles).toHaveCount(1);

    for (const tile of await page.locator('map-tile[zoom="3"]').all()) {
      const isRendered = await tile.evaluate((t: any) => t._tileDiv !== undefined);
      expect(isRendered).toBe(false);
    }
  });
});
