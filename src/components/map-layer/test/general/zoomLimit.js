import { test, expect, chromium } from '@playwright/test';

exports.test = (path, zoomIn, zoomOut) => {
  test.describe(`gcds-map Zoom Limit Tests for ${path.split('.')[0]}`, () => {
    let page;
    let context;
    test.beforeAll(async () => {
      context = await chromium.launchPersistentContext('', { slowMo: 250 });
      page = await context.newPage();
      await page.goto(path);
      await page.waitForTimeout(1000);
      // removes the 2nd layer element in the 1st map
      await page.$eval('xpath=/html/body/gcds-map', (controller) =>
        controller.removeChild(controller.children[1])
      );
    });

    test('Limit gcds-map zooming (zooming in)', async () => {
      for (let i = 0; i < zoomIn; i++) {
        await page.click('.leaflet-control-zoom-in');
        await page.waitForTimeout(500);
      }
      const zoomButton = await page.$eval(
        '.leaflet-control-zoom-in',
        (controller) => controller.className
      );

      expect(zoomButton).toMatch('disabled');
    });

    test('Allow zooming before reaching limit (zooming in)', async () => {
      await page.click('.leaflet-control-zoom-out');
      await page.waitForTimeout(300);
      const zoomButton = await page.$eval(
        '.leaflet-control-zoom-in',
        (controller) => controller.className
      );

      expect(zoomButton).not.toMatch('disabled');
    });

    test('Limit gcds-map zooming (zooming out)', async () => {
      for (let i = 0; i < zoomOut + zoomIn - 2; i++) {
        await page.click('.leaflet-control-zoom-out');
        await page.waitForTimeout(500);
      }
      const zoomButton = await page.$eval(
        '.leaflet-control-zoom-out',
        (controller) => controller.className
      );

      expect(zoomButton).toMatch('disabled');
    });

    test('Allow zooming before reaching limit (zooming out)', async () => {
      await page.click('.leaflet-control-zoom-in');
      await page.waitForTimeout(300);
      const zoomButton = await page.$eval(
        '.leaflet-control-zoom-out',
        (controller) => controller.className
      );

      expect(zoomButton).not.toMatch('disabled');
    });
  });
};
