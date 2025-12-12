import { test, expect, chromium } from '@playwright/test';

test.describe('Playwright templatedFeatures Layer Tests - ZoomTo', () => {
  let page;
  let context;
  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('');
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    await page.goto('/test/map-layer/templatedFeatures.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  });

  test.afterAll(async function () {
    await context.close();
  });

  test('Zoom to layer applies meta extent', async () => {
    await page.waitForTimeout(500);
    const startTopLeft = await page.evaluate(
      `document.querySelector('#map2').extent.topLeft.pcrs`
    );
    const startBottomRight = await page.evaluate(
      `document.querySelector('#map2').extent.bottomRight.pcrs`
    );
    expect(startTopLeft.horizontal).toBe(1509616.5079163536);
    expect(startTopLeft.vertical).toBe(-170323.5596054569);
    expect(startBottomRight.horizontal).toBe(1511931.6167132407);
    expect(startBottomRight.vertical).toBe(-172638.668402344);
    await page.evaluate(
      `document.querySelector('#map2 > map-layer').zoomTo()`
    );
    const endTopLeft = await page.evaluate(
      `document.querySelector('#map2').extent.topLeft.pcrs`
    );
    const endBottomRight = await page.evaluate(
      `document.querySelector('#map2').extent.bottomRight.pcrs`
    );
    expect(endTopLeft.horizontal).toBe(1508601.8288036585);
    expect(endTopLeft.vertical).toBe(-169068.77063754946);
    expect(endBottomRight.horizontal).toBe(1512570.5867411792);
    expect(endBottomRight.vertical).toBe(-173037.52857506275);
  });

  test('Templated features zoomTo method test', async () => {
    const startTopLeft = await page.evaluate(
      `document.querySelector('#map2').extent.topLeft.pcrs`
    );
    const startBottomRight = await page.evaluate(
      `document.querySelector('#map2').extent.bottomRight.pcrs`
    );
    const startZoomLevel = await page.evaluate(
      `document.querySelector('#map2').zoom`
    );
    expect(startTopLeft.horizontal).toBe(1508601.8288036585);
    expect(startTopLeft.vertical).toBe(-169068.77063754946);
    expect(startBottomRight.horizontal).toBe(1512570.5867411792);
    expect(startBottomRight.vertical).toBe(-173037.52857506275);
    expect(startZoomLevel).toBe(16);
    await page.evaluate(
      `document.querySelector('#map2 > map-layer > map-extent > map-link').shadowRoot.querySelector('map-feature').zoomTo()`
    );
    await page.waitForTimeout(1000);
    const endTopLeft = await page.evaluate(
      `document.querySelector('#map2').extent.topLeft.pcrs`
    );
    const endBottomRight = await page.evaluate(
      `document.querySelector('#map2').extent.bottomRight.pcrs`
    );
    const endZoomLevel = await page.evaluate(
      `document.querySelector('#map2').zoom`
    );
    expect(endTopLeft.horizontal).toBe(1509600.685801372);
    expect(endTopLeft.vertical).toBe(-171597.66319532692);
    expect(endBottomRight.horizontal).toBe(1509759.436118871);
    expect(endBottomRight.vertical).toBe(-171756.41351282597);
    // 2024-01-23 updated map-feature.zoom getter to respect map-meta max before
    // max zoom of parent extent (removed parent extent from consideration, use
    // map zoom when feature connects to dom as zoom instead
    expect(endZoomLevel).toBe(22);
  });
});
