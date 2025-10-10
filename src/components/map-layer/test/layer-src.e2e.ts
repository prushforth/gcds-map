import { test, expect, chromium } from '@playwright/test';

test.describe('map-layer local/inline vs remote content/src tests', () => {
  let page;
  let context;
  test.beforeAll(async function () {
    context = await chromium.launchPersistentContext('');
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    await page.goto('/test/map-layer/map-layer.html');
    await page.waitForTimeout(1000);
  });
  test('Test that a map-layer with src attribute can transition to inline content', async () => {
    const layer = await page.getByTestId('test-layer');
    const labelAttribute = await layer.evaluate((l) => l.getAttribute('label'));
    expect(labelAttribute).toEqual('Remote content');
    const labelProperty = await layer.evaluate((l) => l.label);
    // TODO remove Empty when map-extent is implemented
    expect(labelProperty).toEqual('Empty Canada Base Map - Transportation (CBMT)');

    // TODO uncomment when map-layer.zoomTo is implemented
    // await layer.evaluate((layer) => (layer as any).zoomTo());
    // let mapLocation = await viewer.evaluate((v) => ({
    //   lat: v.lat,
    //   lon: v.lon,
    //   zoom: v.zoom
    // }));
    // expect(mapLocation).toEqual(
    //   expect.objectContaining({
    //     zoom: 1,
    //     lat: expect.closeTo(60.28, 2),
    //     lon: expect.closeTo(-89.78, 2)
    //   })
    // );

    // remove the src attribute
    await layer.evaluate((layer) => layer.removeAttribute('src'));
    // empty layer is no longer disabled. Is that correct? I think so...

    // append the template map-extent to the local / inline content
    await page.evaluate(() => {
      let ext = document.head
        .querySelector('template')
        .content.querySelector('map-extent')
        .cloneNode(true);
      document.querySelector('[data-testid=test-layer]').appendChild(ext);
      (document
        .querySelector('[data-testid=test-layer]') as any)
        .whenReady()
        .then(() =>
          (document.querySelector('[data-testid=test-layer]') as any).zoomTo()
        );
    });
    await page.waitForTimeout(1000);
    expect(layer).not.toHaveAttribute('disabled');
    // TODO uncomment when map-layer.zoomTo is implemented
    // mapLocation = await viewer.evaluate((v) => ({
    //   lat: v.lat,
    //   lon: v.lon,
    //   zoom: v.zoom
    // }));
    // expect(mapLocation).toEqual(
    //   expect.objectContaining({
    //     zoom: 3,
    //     lat: expect.closeTo(55.26, 2),
    //     lon: expect.closeTo(-109.13, 2)
    //   })
    // );
    await layer.evaluate(
      (layer) => (layer.label = 'You can set the label of a local layer')
    );
  });
  test('Test that a map-layer with inline content can transition to remote (src-based) content', async () => {
    const layer = await page.getByTestId('test-layer');
    let label = await layer.evaluate((l) => l.label);
    expect(label).toEqual('You can set the label of a local layer');

    // setting the src attribute should clean out the light DOM, populate SD
    await layer.evaluate((layer) => (layer.src = 'dummy-cbmtile-cbmt.mapml'));

    await page.waitForTimeout(1000);
    // remote source layers return the map-title in the label property
    label = await layer.evaluate((l) => l.label);

    expect(label).toEqual('Canada Base Map - Transportation (CBMT)');

    const hasContentInShadowRoot = await layer.evaluate((l) => {
      return l.shadowRoot.querySelector('*') !== null;
    });
    expect(hasContentInShadowRoot).toBe(true);

    const hasNoLightDOMContent = await layer.evaluate(
      (l) => l.querySelector('*') === null
    );
    expect(hasNoLightDOMContent).toBe(true);

    await layer.evaluate((layer) => (layer as any).zoomTo());
    await page.waitForTimeout(1000);
    // TODO uncomment when map-layer.zoomTo is implemented
    // let mapLocation = await viewer.evaluate((v) => ({
    //   lat: v.lat,
    //   lon: v.lon,
    //   zoom: v.zoom
    // }));
    // expect(mapLocation).toEqual(
    //   expect.objectContaining({
    //     zoom: 1,
    //     lat: expect.closeTo(60.28, 2),
    //     lon: expect.closeTo(-89.78, 2)
    //   })
    // );
  });
});
