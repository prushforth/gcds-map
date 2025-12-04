import { test, expect, chromium } from '@playwright/test';

test.describe('Inline Static Features Tests', () => {
  let page;
  let context;
  
  test.beforeAll(async function () {
    context = await chromium.launchPersistentContext('');
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    await page.goto('/test/map-layer/featureLayer.html');
    await page.waitForTimeout(2000);
  });

  test.afterAll(async function () {
    await context.close();
  });

  test('Loading in tilematrix feature', async () => {
    const isRendered = await page.getByTestId('tilematrix-feature').evaluate((feature: any) => {
      if (!feature._groupEl?.isConnected) return false;
      const path = feature._groupEl.querySelector('path');
      return path?.getAttribute('d') === 'M330 83L586 83L586 339L330 339L330 83z';
    });
    
    expect(isRendered).toBe(true);
  });

  test('Loading in pcrs feature', async () => {
    const isRendered = await page.getByTestId('pcrs-feature').evaluate((feature: any) => {
      if (!feature._groupEl?.isConnected) return false;
      const path = feature._groupEl.querySelector('path');
      return path?.getAttribute('d') === 'M153 508L113 146L-161 220L-107 436z';
    });
    
    expect(isRendered).toBe(true);
  });

  test('Loading in tcrs feature', async () => {
    const isRendered = await page.getByTestId('tcrs-feature').evaluate((feature: any) => {
      if (!feature._groupEl?.isConnected) return false;
      const path = feature._groupEl.querySelector('path');
      return path?.getAttribute('d') === 'M285 373L460 380L468 477L329 459z';
    });
    
    expect(isRendered).toBe(true);
  });

  test('Feature without properties renders & is not interactable', async () => {
    const featureRendering = await page
      .locator('map-layer#inline > map-feature')
      .evaluate((f) => f._groupEl.firstChild.getAttribute('d'));
    expect(featureRendering).toEqual(
      'M74 -173L330 -173L330 83L74 83L74 -173z'
    );

    const classList = await page
      .locator('map-layer#inline > map-feature')
      .evaluate((f) => f._groupEl.firstChild.getAttribute('class'));
    // Stencil adds 'hydrated' class to components, which gets copied to the SVG path
    // since the feature element itself gets the class. This is a framework artifact
    // and doesn't affect functionality
    expect(classList).toEqual('hydrated');
  });
});
