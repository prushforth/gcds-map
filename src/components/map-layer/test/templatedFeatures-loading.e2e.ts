import { test, expect, chromium } from '@playwright/test';

test.describe('Playwright templatedFeatures Layer Tests - Loading', () => {
  let page;
  let context;
  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('');
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    await page.goto('/test/map-layer/templatedFeatures.html', { waitUntil: 'networkidle' });
  });

  test.afterAll(async function () {
    await context.close();
  });

  test('Loading in tilematrix cs feature', async () => {
    await page.waitForTimeout(200);
    const feature = await page.getByTestId('tilematrixgeometry');
    const pathCoordinates = await feature.evaluate((f) =>
      f._groupEl.querySelector('path').getAttribute('d')
    );
    expect(pathCoordinates).toEqual('M382 -28L809 -28L809 399L382 399z');
  });

  test('Loading in pcrs feature', async () => {
    const feature = await page.getByTestId('pcrsgeometry');
    const pathCoordinates = await feature.evaluate((f) =>
      f._groupEl.querySelector('path').getAttribute('d')
    );
    expect(pathCoordinates).toEqual('M88 681L21 78L-436 201L-346 561z');
  });

  test('Loading in tcrs feature', async () => {
    const feature = await page.getByTestId('tcrsgeometry');
    const pathCoordinates = await feature.evaluate((f) =>
      f._groupEl.querySelector('path').getAttribute('d')
    );
    expect(pathCoordinates).toEqual('M307 456L599 467L612 629L381 599z');
  });

  test('templated features disabled when panned out of bounds', async () => {
    await page.pause();
    await page.waitForTimeout(2000);
    await page.getByTestId('map2').evaluate((map) => {
      map._map.announceMovement.disable();
    });
    await page.waitForTimeout(200);
    await page.getByTestId('map2').evaluate((map) => {
      map.zoomTo(45.428, -75.346, 14);
    });

    await page.waitForTimeout(500);

    await page.pause();
    let layerAndLayerCheckboxDisabled = await page
      .getByTestId('restaurants')
      .evaluate((layer) => {
        return (
          layer.disabled === true &&
          layer._layerControlCheckbox.disabled === true
        );
      });

    expect(layerAndLayerCheckboxDisabled).toBe(true);
  });
});
