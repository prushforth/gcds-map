import { AxeBuilder } from '@axe-core/playwright';

import type { MapMLViewerElement } from '../../../gcds-map';
import { test, expect } from '@playwright/test';

const messages: string[] = [];

test.describe('gcds-map E2E', () => {

  test('gcds page contains gcds-map, loads mapml.js', async ({ page }) => {

    await page.goto('/src/components/gcds-map/test/gcds-map.e2e.html');
    const map = await page.locator('mapml-viewer');
    expect(map).toBeAttached();

    // Get the actual DOM element instead of E2EElement
    const mapHandle = await map.evaluateHandle((m) => m as MapMLViewerElement);

    // Run `whenLayersReady()` inside the browser context
    await page.evaluate(async (m) => await m.whenLayersReady(), mapHandle);


    // Retrieve the `layers.length
    // @ts-ignore
    const layers = await page.evaluate(m => m.layers.length, mapHandle);
    expect(layers).toBe(1);

    // gcds-* components are operable
    const buttons = await page.locator('gcds-button');
    const count = await buttons.count();
    expect(count).toEqual(1);

    const button = buttons.nth(0);
    expect(button).toBeAttached();

    // Check if it has the 'hydrated' class
    await expect(button).toHaveClass('hydrated', {timeout: 5000});

    const results = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      expect(results.violations.length).toBe(0);

  });
  test.skip('gcds page without mapml-viewer does not load mapml.js', async ({ page }) => {

    await page.goto('/components/gcds-map/test/gcds-no-map.e2e.html');
    const map = await page.locator('mapml-viewer');
    expect(map).not.toBeAttached();
    // detect the dynamically generated script element
    const scriptDetected = await page.evaluate(() => {return document.querySelector('script[src$="mapml.js"]')});
    expect(scriptDetected).toBeFalsy();

    expect(messages.some(msg => msg.includes("MapML module dynamically loaded"))).toBeFalsy();

    // gcds-* components are operable
    const buttons = await page.locator('gcds-button');
    const count = await buttons.count();
    expect(count).toEqual(1);

    const button = buttons.nth(0);
    expect(button).toBeAttached();

    // Check if it has the 'hydrated' class
    await expect(button).toHaveClass('hydrated', {timeout: 5000});

    const results = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      expect(results.violations.length).toBe(0);
  });
});
