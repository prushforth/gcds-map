import { test, expect, chromium } from '@playwright/test';

test.describe('Adding and Removing Multiple Extents', () => {
  let page;
  let context;
  test.beforeAll(async function () {
    context = await chromium.launchPersistentContext('', { slowMo: 500 });
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    await page.goto('/test/map-extent/multipleExtents.html');
    await page.waitForTimeout(2000);
  });

  test.afterAll(async function () {
    await context.close();
  });

  test("Layer's multiple extents display on map and in layer control", async () => {
    const cbmtExtent = await page.getByTestId('cbmt-extent');
    const cbmtExtentIsRendered = await cbmtExtent.evaluate(
      (e) =>
        e._extentLayer._container.querySelectorAll('.mapml-tile-group').length
    );
    const alabamaExtent = await page.getByTestId('alabama-extent');
    const alabamaExtentIsRendered = await alabamaExtent.evaluate(
      (e) =>
        e._extentLayer._container.querySelectorAll(
          '.mapml-features-tiles-container'
        ).length
    );
    const cbmtLabel = await page.$eval('text=cbmt', (label) => label.innerText);
    const alabamaLabel = await page.$eval(
      'text=alabama_feature',
      (label) => label.innerText
    );
    expect(cbmtExtentIsRendered).toEqual(9); // tile container divs
    expect(alabamaExtentIsRendered).toEqual(1); // 2 links, 1 style, 1 svg
    expect(cbmtLabel).toEqual('cbmt');
    expect(alabamaLabel).toEqual('alabama_feature');
  });

  test('Changing extent opacity, removing and adding extent effects expected changes to map container layer content', async () => {
    // change opacity on cbmt templated extent, then remove it
    await page.hover(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div'
    );
    await page.click(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div > div > button:nth-child(2)'
    );
    await page.click(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(1) > div.mapml-layer-item-properties > div > button.mapml-layer-item-settings-control.mapml-button'
    );
    await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(1) > div.mapml-layer-item-settings > details',
      (div) => (div.open = true)
    );
    // change cbmt opacity to 50%
    await page.click(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(1) > div.mapml-layer-item-settings > details > input[type=range]'
    );

    // remove the cbmt extent by clearing its checkbox, leaving two  layers,
    // each with a single extent (alabama_feature, single-extent/toporama image)
    await page.click('text=cbmt');
    const startExtentCount = await page.$$eval(
      'div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > div > div.mapml-extentlayer-container',
      (extents) => extents.length
    );
    let alabama = await page.$eval(
      'div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > div > div.mapml-extentlayer-container',
      (div) => div.className
    );
    expect(startExtentCount).toEqual(2);
    expect(alabama).toEqual('leaflet-layer mapml-extentlayer-container');

    // restore the cbmt extent
    await page.click('text=cbmt');
    const endExtentCount = await page.$$eval(
      'div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > div > div.mapml-extentlayer-container',
      (extents) => extents.length
    );
    expect(endExtentCount).toEqual(3);

    //expect alabama to still be rendered on top of cbmt
    const alabamaZIndex = await page
      .getByTestId('alabama-extent')
      .evaluate((e) => Number(e._extentLayer._container.style.zIndex));
    const cbmtZIndex = await page
      .getByTestId('cbmt-extent')
      .evaluate((e) => Number(e._extentLayer._container.style.zIndex));
    expect(alabamaZIndex).toBeGreaterThan(cbmtZIndex);

    const layerOpacity = await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > details > input[type=range]',
      (opacity) => opacity.value
    );
    expect(layerOpacity).toEqual('1');
    const cbmtOpacity = await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(1) > div.mapml-layer-item-settings > details > input[type=range]',
      (opacity) => opacity.value
    );
    expect(cbmtOpacity).toEqual('0.5');
    // the mapml-templated-tile-container is a child of mapml-extentlayer-container
    // the parent is the extent container, and controls the opacity
    // the child should always have an opacity of 1 (never set, default value from Leaflet)
    // the opacity of the extent content should be restored through cycling it off/on
    const cbmtExtentLayerContainerOpacity = await page
      .getByTestId('cbmt-extent')
      .evaluate((e) => e._extentLayer._container.style.opacity);
    expect(cbmtExtentLayerContainerOpacity).toEqual('0.5');
    const cbmtTemplatedTileContainerOpacity = await page
      .getByTestId('cbmt-template')
      .evaluate((t) => t._templatedLayer._container.style.opacity);
    expect(cbmtTemplatedTileContainerOpacity).toEqual('1');
    const alabamaOpacity = await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(2) > div.mapml-layer-item-settings > details > input[type=range]',
      (opacity) => opacity.value
    );
    expect(alabamaOpacity).toEqual('1');
  });

  test('Changing extent opacity, removing and adding extent effects expected changes to only that specific content', async () => {
    // change opacity on alabama templated extent, then remove it
    await page.click(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(2) > div.mapml-layer-item-properties > div > button.mapml-layer-item-settings-control.mapml-button'
    );
    await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(2) > div.mapml-layer-item-settings > details',
      (div) => (div.open = true)
    );
    // change alabama opacity to 50%
    await page.click(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(2) > div.mapml-layer-item-settings > details > input[type=range]'
    );

    await page.click('text=alabama_feature');
    const startExtentCount = await page.$$eval(
      'div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > div > div.mapml-extentlayer-container',
      (extents) => extents.length
    );
    let cbmt = await page.getByTestId('cbmt-extent').evaluate(
      (e) => e._extentLayer.getContainer().firstElementChild.className
    );
    expect(startExtentCount).toEqual(2);
    expect(cbmt).toEqual('leaflet-layer mapml-templated-tile-container');

    // restore alabama to map
    await page.click('text=alabama_feature');
    const endExtentCount = await page.$$eval(
      'div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > div > div.mapml-extentlayer-container',
      (extents) => extents.length
    );
    let cbmtStyle = await page.getByTestId('cbmt-extent').evaluate(
      (e) => e._extentLayer.getContainer().getAttribute('style')
    );
    const alabama = await page.$eval(
      "div.mapml-extentlayer-container[style='opacity: 0.5; z-index: 2;'] > div",
      (div) => div.className
    );
    const layerOpacity = await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > details > input[type=range]',
      (opacity) => opacity.value
    );
    const cbmtOpacity = await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(1) > div.mapml-layer-item-settings > details > input[type=range]',
      (opacity) => opacity.value
    );
    const alabamaOpacity = await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(2) > div.mapml-layer-item-settings > details > input[type=range]',
      (opacity) => opacity.value
    );
    expect(endExtentCount).toEqual(3);
    // alabama is a templated feature extent
    // the opacity of the alabama features is tested by the selector
    expect(alabama).toEqual(
      'leaflet-layer mapml-features-tiles-container leaflet-pane mapml-vector-container'
    );
    // cbmt is a templated tile extent
    // the opacity of the cbmt tiles is tested by the selector
    expect(cbmtStyle).toEqual('opacity: 0.5; z-index: 1;');
    expect(layerOpacity).toEqual('1');
    expect(cbmtOpacity).toEqual('0.5');
    expect(alabamaOpacity).toEqual('0.5');
  });

  test('Extents retain their state when turning layer off and on', async () => {
    await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > details',
      (div) => (div.open = true)
    );
    // sets the Multiple Extents layer opacity to 0.5
    await page.click(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > details > input[type=range]'
    );

    // turn the Multiple Extents layer off
    await page.click("text='Multiple Extents'");
    let layersCount = await page.$eval(
      'div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane',
      (div) => div.childElementCount
    );
    expect(layersCount).toEqual(1);

    // turn the Multiple Extents layer on
    await page.click("text='Multiple Extents'");
    const cbmtClass = await page.$eval(
      "div.mapml-extentlayer-container[style='opacity: 0.5; z-index: 1;'] > div",
      (div) => div.className
    );
    const alabamaStyle = await page.getByTestId('alabama-extent').evaluate(
      (e) => e._extentLayer.getContainer().getAttribute('style')
    );
    const layer = page.getByTestId('multiple-extents');

    const layerOpacity = await layer.evaluate((layer) => {
      return layer._layerControl._container.querySelector(
        '.mapml-layer-item-opacity.mapml-control-layers input'
      ).value;
    });
    const cbmtOpacity = await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(1) > div.mapml-layer-item-settings > details > input[type=range]',
      (opacity) => opacity.value
    );
    const alabamaOpacity = await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div.mapml-layer-item-settings > fieldset > fieldset:nth-child(2) > div.mapml-layer-item-settings > details > input[type=range]',
      (opacity) => opacity.value
    );
    // alabama opacity is tested by the selector
    expect(alabamaStyle).toEqual('opacity: 0.5; z-index: 2;');
    // cbmt opacity is tested by the selector
    expect(cbmtClass).toEqual('leaflet-layer mapml-templated-tile-container');
    expect(layerOpacity).toEqual('0.5');
    expect(cbmtOpacity).toEqual('0.5');
    expect(alabamaOpacity).toEqual('0.5');
  });
});
