import { test, expect, chromium } from '@playwright/test';

test.describe('Playwright Map Element Tests', () => {
  let page;
  let context;
  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', { slowMo: 500 });
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    await page.goto('/test/gcds-map/debugMode.html');
  });

  test.afterAll(async function () {
    await context.close();
  });

  test.beforeEach(async () => {
    await page.reload();
    await page.waitForTimeout(2000);
    const map = page.getByTestId('viewer');
    await map.evaluate(async (map) => { await map.whenReady(); map.toggleDebug(); });
    await page.waitForTimeout(2000);
  });

  test('Debug elements added to map', async () => {
    const panel = await page.$eval(
      'div > table.mapml-debug > tbody.mapml-debug-panel',
      (panelElem) => panelElem.childElementCount
    );

    const banner = await page.$eval(
      'div > table.mapml-debug > caption.mapml-debug-banner',
      (bannerElem) => bannerElem.innerText
    );

    const grid = await page.$eval(
      'div > div.leaflet-pane.leaflet-map-pane > div.leaflet-layer.mapml-debug-grid',
      (gridElem) => gridElem.childElementCount
    );

    expect(panel).toEqual(6);
    expect(banner).toEqual('DEBUG MODE');
    expect(grid).toEqual(1);
  });

  test('Reasonable debug layer extent created', async () => {
    await expect(
      page.locator('.mapml-debug-vectors.cbmt-inline-layer')
    ).toHaveCount(1);
    await expect(
      page.locator('.mapml-debug-vectors.cbmt-large-layer')
    ).toHaveCount(1);
    await expect(
      page.locator('.mapml-debug-vectors.cbmt-beyond-layer')
    ).toHaveCount(1);
  });

  test('Accurate debug coordinates', async () => {
    await page.hover('body > gcds-map');
    const tile = await page.$eval(
      'div > table.mapml-debug > tbody.mapml-debug-panel > tr:nth-child(1)',
      (tileElem) => tileElem.innerText
    );
    const matrix = await page.$eval(
      'div > table.mapml-debug > tbody.mapml-debug-panel > tr:nth-child(2)',
      (matrixElem) => matrixElem.innerText
    );
    const map = await page.$eval(
      'div > table.mapml-debug > tbody.mapml-debug-panel > tr:nth-child(3)',
      (mapElem) => mapElem.innerText
    );
    const tcrs = await page.$eval(
      'div > table.mapml-debug > tbody.mapml-debug-panel > tr:nth-child(4)',
      (tcrsElem) => tcrsElem.innerText
    );
    const pcrs = await page.$eval(
      'div > table.mapml-debug > tbody.mapml-debug-panel > tr:nth-child(5)',
      (pcrsElem) => pcrsElem.innerText
    );
    const gcrs = await page.$eval(
      'div > table.mapml-debug > tbody.mapml-debug-panel > tr:nth-child(6)',
      (gcrsElem) => gcrsElem.innerText
    );

    expect(tile).toEqual('tile: i: 141, j: 6');
    expect(matrix).toEqual('tilematrix: column: 3, row: 4');
    expect(map).toEqual('map: i: 250, j: 250');
    expect(tcrs).toEqual('tcrs: x: 909, y: 1030');
    expect(pcrs).toEqual('pcrs: easting: 217676.00, northing: -205599.86');
    expect(gcrs).toEqual('gcrs: lon: -92.152897, lat: 47.114275');
  });

  test('Layer disabled attribute update when debug is toggled off', async () => {
    await page.$eval('body > gcds-map', (map) => map.toggleDebug());

    await page.$eval('body > gcds-map', (map) => map.zoomTo(-51, 170, 0));

    await page.waitForTimeout(1000);

    const layer = await page.$eval(
      'body > gcds-map > map-layer:nth-child(1)',
      (elem) => elem.hasAttribute('disabled')
    );

    expect(layer).toEqual(true);
  });

  test('Debug mode correctly re-enabled after disabling', async () => {
    await page.$eval('body > gcds-map', (map) => map.toggleDebug());

    await page.$eval('body > gcds-map', (map) => map.zoomTo(-51, 170, 0));

    await page.waitForTimeout(1000);
    await page.$eval('body > gcds-map', (map) => map.back());
    await page.$eval('body > gcds-map', (map) => map.toggleDebug());

    const panel = await page.$eval(
      'div > table.mapml-debug > tbody.mapml-debug-panel',
      (panelElem) => panelElem.childElementCount
    );

    const banner = await page.$eval(
      'div > table.mapml-debug > caption.mapml-debug-banner',
      (bannerElem) => bannerElem.innerText
    );

    const grid = await page.$eval(
      'div > div.leaflet-pane.leaflet-map-pane > div.leaflet-layer.mapml-debug-grid',
      (gridElem) => gridElem.childElementCount
    );

    expect(panel).toEqual(6);
    expect(banner).toEqual('DEBUG MODE');
    expect(grid).toEqual(1);
  });

  test('Layer deselected then selected again', async () => {
    await page.hover('.leaflet-top.leaflet-right');
    await page.click(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset:nth-child(1) > div:nth-child(1) > label > span'
    );
    await expect(
      page.locator('.mapml-debug-vectors.cbmt-inline-layer')
    ).toHaveCount(0);
    const map = await page.getByTestId('viewer');
    const announceMovement = await map.evaluate((map) => map._map.options.announceMovement)
    if (announceMovement) {
      await expect(page.locator('.mapml-debug-vectors')).toHaveCount(4);
    } else {
      await expect(page.locator('.mapml-debug-vectors')).toHaveCount(3);
    }
    await page.hover('.leaflet-top.leaflet-right');
    await page.click(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset:nth-child(1) > div:nth-child(1) > label > span'
    );
    await expect(
      page.locator('.mapml-debug-vectors.cbmt-inline-layer')
    ).toHaveCount(1);
    if (announceMovement) {
      await expect(page.locator('.mapml-debug-vectors')).toHaveCount(5); 
    } else {
      await expect(page.locator('.mapml-debug-vectors')).toHaveCount(4);
    }
  });
});
