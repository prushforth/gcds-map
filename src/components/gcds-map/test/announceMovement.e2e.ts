import { test, expect, chromium } from '@playwright/test';

test.describe('Announce movement test', () => {
  let page;
  let context;
  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', { slowMo: 500 });
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
  });

  test.beforeEach(async () => {
    await page.goto('/test/gcds-map/gcds-map.html');
    await page.waitForTimeout(2000);
    // Focus the map initially
    const map = await page.getByTestId('testviewer');
    await map.click();
    await page.waitForTimeout(500);
  });

  test.afterAll(async function () {
    await context.close();
  });

  test('Output values are correct during regular movement', async () => {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(1000);
    const map = await page.getByTestId('testviewer');
    const movedUp = await map.evaluate((map) => {
      let output = map.shadowRoot
        ? map.shadowRoot.querySelector('output')
        : map.querySelector('div').shadowRoot.querySelector('output');
      return output.innerHTML;
    });
    expect(movedUp).toEqual('zoom level 0');

    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(1000);
    }

    const movedLeft = await map.evaluate((map) => {
      let output = map.shadowRoot
        ? map.shadowRoot.querySelector('output')
        : map.querySelector('div').shadowRoot.querySelector('output');
      return output.innerHTML;
    });
    expect(movedLeft).toEqual('zoom level 0');

    await page.keyboard.press('Equal');
    await page.waitForTimeout(1000);

    const zoomedIn = await map.evaluate((map) => {
      let output = map.shadowRoot
        ? map.shadowRoot.querySelector('output')
        : map.querySelector('div').shadowRoot.querySelector('output');
      return output.innerHTML;
    });
    expect(zoomedIn).toEqual('zoom level 1');

    await page.keyboard.press('Minus');
    await page.waitForTimeout(1000);

    const zoomedOut = await map.evaluate((map) => {
      let output = map.shadowRoot
        ? map.shadowRoot.querySelector('output')
        : map.querySelector('div').shadowRoot.querySelector('output');
      return output.innerHTML;
    });
    expect(zoomedOut).toEqual(
      'At minimum zoom level, zoom out disabled zoom level 0'
    );
    // testing + button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    const zoomedBackIn = await map.evaluate((map) => {
      let output = map.shadowRoot
        ? map.shadowRoot.querySelector('output')
        : map.querySelector('div').shadowRoot.querySelector('output');
      return output.innerHTML;
    });
    expect(zoomedBackIn).toEqual('zoom level 1');
  });

  test('Output values are correct at bounds and bounces back', async () => {
    await page.keyboard.press('Equal'); // Zoom in "+/=" key
    //Zoom out to min layer bound
    await page.keyboard.press('Minus');
    await page.waitForTimeout(1000);

    await page.waitForFunction(() => {
      const map = document.querySelector('gcds-map');
      if (!map) return false;
      let output = map.shadowRoot
        ? map.shadowRoot.querySelector('output')
        : map.querySelector('div')?.shadowRoot?.querySelector('output');
      if (!output) return false;
      return output.innerHTML === 'At minimum zoom level, zoom out disabled zoom level 0';
    });
    //Pan out of west bounds, expect the map to bounce back
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(1000);
      await page.keyboard.press('ArrowLeft');
    }

    await page.waitForFunction(() => {
      const map = document.querySelector('gcds-map');
      if (!map || !map.shadowRoot) return false;
      let output = map.shadowRoot.querySelector('output');
      if (!output) return false;
      return output.innerHTML === 'Reached west bound, panning west disabled';
    });

    await page.waitForFunction(() => {
      const map = document.querySelector('gcds-map');
      if (!map) return false;
      let output = map.shadowRoot
        ? map.shadowRoot.querySelector('output')
        : map.querySelector('div')?.shadowRoot?.querySelector('output');
      if (!output) return false;
      return output.innerHTML === 'zoom level 0';
    });

    //Zoom in greater than map zoom bounds, expect the map to zoom back
    // await page.keyboard.press('Equal');
    // await page.waitForFunction(() => {
    //   const map = document.querySelector('gcds-map');
    //   if (!map) return false;
    //   let output = map.shadowRoot
    //     ? map.shadowRoot.querySelector('output')
    //     : map.querySelector('div')?.shadowRoot?.querySelector('output');
    //   if (!output) return false;
      // this is looking for locale.amZoomedOut per line 101 of AnnounceMovement.js
      // which means that the zoom out of bounds happened but that
      // can't normally happen via keyboard or mouse?
      // I don't believe this is operational, and maybe it should not be tbd
      // the layer becomes disabled, but the map can continue to zoom beyond
      // the layer's max zoom...
    //   return output.innerHTML === 'Zoomed out of bounds, returning to';
    // });
  //   await page.waitForFunction(() => {
  //     const map = document.querySelector('gcds-map');
  //     if (!map) return false;
  //     let output = map.shadowRoot
  //       ? map.shadowRoot.querySelector('output')
  //       : map.querySelector('div')?.shadowRoot?.querySelector('output');
  //     if (!output) return false;
  //     return output.innerHTML === 'zoom level 0';
  //   });
  });
});
