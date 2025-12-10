import { test, expect, chromium } from '@playwright/test';

test.describe('Playwright mapMLTemplatedTile Layer Tests - Rendering', () => {
  let page;
  let context;
  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('');
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    await page.goto('/test/map-layer/templatedTileLayer.html', { waitUntil: 'networkidle' });
  });

  test.afterAll(async function () {
    await context.close();
  });

  test.beforeEach(async () => {
    await page.waitForTimeout(250);
  });

  test('SVG tiles load in on default map zoom level', async () => {
    // # of tiles = 8
    await expect(
      page.locator('.mapml-extentlayer-container svg')
    ).toHaveCount(8);
  });

  test('Templated tile layer works without <map-input> for zoom level', async () => {
    // tests fix for https://github.com/Maps4HTML/MapML.js/issues/669
    await page.hover(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div'
    );
    const layerCount = await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays',
      (el) => el.children.length
    );
    expect(layerCount).toEqual(3);
  });
});
