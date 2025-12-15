import { test, expect, chromium } from '@playwright/test';

test.describe('Feature Links Tests', () => {
  let page;
  let context;
  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('');
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    await page.goto('/test/map-feature/featureLinks.html', { waitUntil: 'networkidle' });
  });

  test.afterAll(async function () {
    await context.close();
  });

  test.describe('Sub Part Link Tests', () => {
    test('Sub-point link adds new layer', async () => {
      const layers = await page.$eval(
        'body > gcds-map',
        (map) => map.layers.length
      );
      expect(layers).toEqual(1);
      for (let i = 0; i < 2; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
      }
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
      }
      await page.keyboard.press('Enter'); // Press enter on the point subpart of the 'Accessible Square' feature
      await page.waitForTimeout(1000);
      expect( await page.$eval(
        'body > gcds-map',
        (map) => map.layers.length
      )).toEqual(layers+1);
    });

    test('Sub-point inplace link adds new layer, parent feature has separate link', async () => {
      // remove the layer added by the previous test
      await page.hover('.leaflet-top.leaflet-right');
      await page.click(
        'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset:nth-child(2) > div:nth-child(1) > div > button:nth-child(1)'
      );
      await page.waitForTimeout(850);
      await page.click('body > gcds-map');
      await page.keyboard.press('Tab');
      for (let i = 0; i < 9; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
      }
      const extentBeforeLink = await page.$eval(
        'body > gcds-map',
        (map) => map.extent
      );
      const layers = await page.$eval(
        'body > gcds-map',
        (map) => map.layers.length
      );
      await page.keyboard.press('Enter'); // Press enter on the point of the 'Inplace' feature
      await page.waitForTimeout(1000);
      const layerName = await page.$eval(
        '//html/body/gcds-map/map-layer[2]',
        (layer) => layer.label
      );
      const extentAfterLink = await page.$eval(
        'body > gcds-map',
        (map) => map.extent
      );

      expect(extentAfterLink.topLeft.gcrs).toEqual(
        extentBeforeLink.topLeft.gcrs
      );
      expect(extentAfterLink.bottomRight.gcrs).toEqual(
        extentBeforeLink.bottomRight.gcrs
      );
      expect(await page.$eval(
        'body > gcds-map',
        (map) => map.layers.length
      )).toEqual(layers+1);
      expect(layerName).toEqual('Fire Danger (forecast)');
    });
  });
  test.describe('Main Part Link Tests', () => {
    test('Main part adds new layer', async () => {
      // remove the layer added by the previous test
      await page.hover('.leaflet-top.leaflet-right');
      await page.click(
        'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset:nth-child(2) > div:nth-child(1) > div > button:nth-child(1)'
      );
      await page.waitForTimeout(850);
      await page.click('body > gcds-map');
      await page.keyboard.press('Tab');
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
      }
      const layers = await page.$eval(
        'body > gcds-map',
        (map) => map.layers.length
      );
      await page.keyboard.press('Enter'); // Press enter on main part of 'Inplace' feature
      await page.waitForTimeout(1000);
      const layerName = await page.$eval(
        '//html/body/gcds-map/map-layer[2]',
        (layer) => layer.label
      );
      const extent = await page.$eval('body > gcds-map', (map) => map.extent);

      expect(extent.topLeft.gcrs).toEqual({
        horizontal: -129.071567338887,
        vertical: 36.4112695268206
      });
      expect(extent.bottomRight.gcrs).toEqual({
        horizontal: 26.18468754289824,
        vertical: 2.850936151427951
      });
      expect(await page.$eval(
        'body > gcds-map',
        (map) => map.layers.length
      )).toEqual(layers+1);
      expect(layerName).toEqual('Canada Base Map - Geometry');
    });
  });
});
