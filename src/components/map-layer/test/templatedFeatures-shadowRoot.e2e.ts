import { test, expect, chromium } from '@playwright/test';

test.describe('Playwright templatedFeatures Layer Tests - ShadowRoot', () => {
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

  test("Templated features attach to map-link shadow root", async () => {
    await page.pause();
    const featuresLink = await page.getByTestId('restaurants-link');
    const shadow = await featuresLink.evaluate((link) => link.shadowRoot);
    const features = await featuresLink.evaluate((link) => link.shadowRoot.querySelectorAll('map-feature').length);
    expect(shadow).toBeTruthy();
    expect(features).toBe(8);
  });
});
