import { test, expect, chromium } from '@playwright/test';

let controls = [
  'leaflet-control-zoom leaflet-bar leaflet-control',
  'mapml-reload-button leaflet-bar leaflet-control',
  'leaflet-control-fullscreen leaflet-bar leaflet-control'
];
let options = ['nozoom', 'noreload', 'nofullscreen'];

test.describe('Playwright gcds-map Controls Tests', () => {
  let page;
  let context;
  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('');
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    page = await context.newPage();
    await page.goto('/test/gcds-map/gcds-map.html');
    await page.waitForTimeout(1000);
  });

  test.afterAll(async function () {
    await context.close();
  });

  test.describe('Attributes Tests', () => {
    for (let i in controls) {
      test.describe('Controls List ' + options[i] + ' Attribute Tests', () => {
        test(options[i] + ' removes controls', async () => {
          await page.$eval(
            'body > gcds-map',
            (layer, context) =>
              layer.setAttribute('controlslist', context.options[context.i]),
            { options: options, i: i }
          );
          await page.waitForTimeout(500);

          let children = await page.$eval(
              'div > div.leaflet-control-container > div.leaflet-top.leaflet-left',
              (div) => div.children
            ),
            found = false;
          for (const value of Object.values(children)) {
            if ((value as any).className === controls[i]) found = true;
          }
          expect(found).toEqual(false);
        });

        test("Toggle controls, controls aren't re-enabled", async () => {
          await page.click('body > gcds-map', { button: 'right' });
          await page.waitForTimeout(300);
          await page.click('div > div.mapml-contextmenu > button:nth-child(6)');
          await page.waitForTimeout(300);
          await page.click('body > gcds-map', { button: 'right' });
          await page.waitForTimeout(300);
          await page.click('div > div.mapml-contextmenu > button:nth-child(6)');
          await page.waitForTimeout(500);

          let children = await page.$eval(
              'div > div.leaflet-control-container > div.leaflet-top.leaflet-left',
              (div) => div.children
            ),
            found = false;
          for (const value of Object.values(children)) {
            if ((value as any).className === controls[i]) found = true;
          }
          expect(found).toEqual(false);
        });
      });
    }

    test.describe('Controls List nolayer Attribute Tests', () => {
      test('controlslist=nolayer removes layer control', async () => {
        await page.$eval('body > gcds-map', (layer) =>
          layer.setAttribute('controlslist', 'nolayer')
        );
        await page.waitForTimeout(500);
        let layerControl = await page.locator('.leaflet-control-layers');
        await expect(layerControl).toBeHidden();

        await page.click('body > gcds-map', { button: 'right' });
        await page.waitForTimeout(300);
        // toggle controls
        await page.click('.mapml-contextmenu > button:nth-of-type(6)');
        await page.waitForTimeout(300);
        await page.click('body > gcds-map', { button: 'right' });
        await page.waitForTimeout(300);
        // toggle controls
        await page.click('.mapml-contextmenu > button:nth-of-type(6)');
        await page.waitForTimeout(500);

        await expect(layerControl).toBeHidden();
      });
    });
  });
});
