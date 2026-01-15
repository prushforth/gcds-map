import { test, expect, chromium } from '@playwright/test';

test.describe('Multiple Extents Reordering and zIndex Tests', () => {
  let page;
  let context;
  test.beforeAll(async function () {
    context = await chromium.launchPersistentContext('', { slowMo: 1000 });
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    await page.goto('/test/map-extent/multipleExtents.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });
  test.afterAll(async function () {
    await context.close();
  });

  test('Move extent down in the layer control / up in the zIndex', async () => {
    // starting conditions
    let firstExtentInLayerControl = await page.$eval(
      'fieldset.mapml-layer-grouped-extents > fieldset:nth-child(1) span',
      (span) => span.innerText.toLowerCase()
    );
    expect(firstExtentInLayerControl).toEqual('cbmt');
    let secondExtentInLayerControl = await page.$eval(
      'fieldset.mapml-layer-grouped-extents > fieldset:nth-child(2) span',
      (span) => span.innerText.toLowerCase()
    );
    expect(secondExtentInLayerControl).toEqual('alabama_feature');
    // alabama (a templated features layer) should have a higher zIndex than cbmt
    let alabamaIndex = await page.$eval(
      'div.mapml-features-tiles-container',
      (div) => +div.closest('.mapml-extentlayer-container').style.zIndex
    );
    let cbmtIndex = await page.$eval(
      'div.mapml-templated-tile-container',
      (div) => +div.closest('.mapml-extentlayer-container').style.zIndex
    );
    expect(cbmtIndex).toBeLessThan(alabamaIndex);

    // reverse the order of the extent via the layer control
    await page.hover('.leaflet-top.leaflet-right');
    await page.waitForTimeout(250);
    // get the bounds of the CBMT extent
    await page.click(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div > div > button:nth-child(2)'
    );
    await page.waitForTimeout(250);
    let control = await page.$(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset:nth-child(1) > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(1)'
    );
    await page.waitForTimeout(250);
    let controlBBox = await control.boundingBox();
    // drag it down the page one notch / up in the ZIndex order by one
    await page.mouse.move(
      controlBBox.x + controlBBox.width / 2,
      controlBBox.y + controlBBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      controlBBox.x + controlBBox.width / 2,
      controlBBox.y + controlBBox.height / 2 + 48
    );

  await page.waitForTimeout(250);

    // drop it
    await page.mouse.up();
    await page.waitForTimeout(500);

    // having been re-ordered, alabama should be first in the layer control
    firstExtentInLayerControl = await page.$eval(
      'fieldset.mapml-layer-grouped-extents > fieldset:nth-child(1) span',
      (span) => span.innerText.toLowerCase()
    );
    expect(firstExtentInLayerControl).toEqual('alabama_feature');
    secondExtentInLayerControl = await page.$eval(
      'fieldset.mapml-layer-grouped-extents > fieldset:nth-child(2) span',
      (span) => span.innerText.toLowerCase()
    );
    expect(secondExtentInLayerControl).toEqual('cbmt');
    // alabama (a templated features layer) should have a lower zIndex than cbmt
    alabamaIndex = await page.$eval(
      'div.mapml-features-tiles-container',
      (div) => +div.closest('.mapml-extentlayer-container').style.zIndex
    );
    cbmtIndex = await page.$eval(
      'div.mapml-templated-tile-container',
      (div) => +div.closest('.mapml-extentlayer-container').style.zIndex
    );
    expect(alabamaIndex).toBeLessThan(cbmtIndex);
  });

  test('Ensure Same Order When Extent and Layer Checked Off/On', async () => {
    // turn the Multiple Extents layer off
    await page.click("text='Multiple Extents'");
    let layersCount = await page.$eval(
      'div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane',
      (div) => div.childElementCount
    );
    expect(layersCount).toEqual(1);
    await page.click("text='Multiple Extents'");
    layersCount = await page.$eval(
      'div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane',
      (div) => div.childElementCount
    );
    expect(layersCount).toEqual(2);

    // having not been re-ordered, alabama should remain first in the layer control
    let firstExtentInLayerControl = await page.$eval(
      'fieldset.mapml-layer-grouped-extents > fieldset:nth-child(1) span',
      (span) => span.innerText.toLowerCase()
    );
    expect(firstExtentInLayerControl).toEqual('alabama_feature');
    let secondExtentInLayerControl = await page.$eval(
      'fieldset.mapml-layer-grouped-extents > fieldset:nth-child(2) span',
      (span) => span.innerText.toLowerCase()
    );
    expect(secondExtentInLayerControl).toEqual('cbmt');

    let alabama = await page.$$eval(
      'div.mapml-features-tiles-container',
      (divs) => divs.length
    );
    expect(alabama).toEqual(1);
    let cbmt = await page.$$eval(
      'div.mapml-templated-tile-container',
      (divs) => divs.length
    );
    expect(cbmt).toEqual(1);

    await page.click("text='Multiple Extents'");
    layersCount = await page.$eval(
      'div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane',
      (div) => div.childElementCount
    );
    expect(layersCount).toEqual(1);
    await page.click("text='Multiple Extents'");
    layersCount = await page.$eval(
      'div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane',
      (div) => div.childElementCount
    );
    expect(layersCount).toEqual(2);

    // having not been re-ordered, alabama should remain first in the layer control
    firstExtentInLayerControl = await page.$eval(
      'fieldset.mapml-layer-grouped-extents > fieldset:nth-child(1) span',
      (span) => span.innerText.toLowerCase()
    );
    expect(firstExtentInLayerControl).toEqual('alabama_feature');
    secondExtentInLayerControl = await page.$eval(
      'fieldset.mapml-layer-grouped-extents > fieldset:nth-child(2) span',
      (span) => span.innerText.toLowerCase()
    );
    expect(secondExtentInLayerControl).toEqual('cbmt');

    alabama = await page.$$eval(
      'div.mapml-features-tiles-container',
      (divs) => divs.length
    );
    expect(alabama).toEqual(1);
    cbmt = await page.$$eval(
      'div.mapml-templated-tile-container',
      (divs) => divs.length
    );
    expect(cbmt).toEqual(1);
  });

  test('Move Extent Back Up in the Layer Control', async () => {
    await page.hover('.leaflet-top.leaflet-right');
    let control = await page.$(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset:nth-child(1) > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(2)'
    );
    let controlBBox = await control.boundingBox();
    await page.mouse.move(
      controlBBox.x + controlBBox.width / 2,
      controlBBox.y + controlBBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      controlBBox.x + controlBBox.width / 2,
      controlBBox.y + controlBBox.height / 2 - 48
    );
    await page.mouse.up();
    await page.waitForTimeout(200);

    // having been re-ordered, cbmt should be first in the layer control
    let firstExtentInLayerControl = await page.$eval(
      'fieldset.mapml-layer-grouped-extents > fieldset:nth-child(1) span',
      (span) => span.innerText.toLowerCase()
    );
    expect(firstExtentInLayerControl).toEqual('cbmt');
    let secondExtentInLayerControl = await page.$eval(
      'fieldset.mapml-layer-grouped-extents > fieldset:nth-child(2) span',
      (span) => span.innerText.toLowerCase()
    );
    expect(secondExtentInLayerControl).toEqual('alabama_feature');

    // alabama (a templated features layer) should now have a higher zIndex than cbmt
    let alabamaIndex = await page.$eval(
      'div.mapml-features-tiles-container',
      (div) => +div.closest('.mapml-extentlayer-container').style.zIndex
    );
    let cbmtIndex = await page.$eval(
      'div.mapml-templated-tile-container',
      (div) => +div.closest('.mapml-extentlayer-container').style.zIndex
    );
    expect(cbmtIndex).toBeLessThan(alabamaIndex);
  });
});
