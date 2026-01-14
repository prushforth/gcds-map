import { test, expect, chromium } from '@playwright/test';

async function zoomIn(page: any, requestCount: number, urlBase: string, url: string) {
  let u = '';
  let requests = 0;
  page.on('request', (request: any) => {
    if (request.url().includes(urlBase)) {
      requests += 1;
      u = request.url();
    }
  });
  await page.keyboard.press('Equal');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  expect(requests).toEqual(requestCount);
  if (url !== '') expect(u).toContain(url);
}

test.describe('Templated features layer with step', () => {
  test.describe.serial('Request Tests', () => {
    let page;
    let context;
    
    const urlBase = 'alabama_feature.mapml';
    const u1 = '-8030725.916518498-9758400.22013378111151604.1148082329423929.8111929520';
    const panU = '-437169.06273812056-1766644.65328931063531588.8747777492202113.28422656663';

    test.beforeAll(async () => {
      context = await chromium.launchPersistentContext('');
      page =
        context.pages().find((page) => page.url() === 'about:blank') ||
        (await context.newPage());
      await page.goto('/test/map-link/featureStep.html', { waitUntil: 'networkidle' });
    });

    test.afterAll(async () => {
      await context.close();
    });

    test('On add requests zoom level 0', async () => {
      let url = '';
      await page.on('request', (request) => {
        if (request.url().includes(urlBase)) {
          url = request.url();
        }
      });
      await page.waitForTimeout(500);
      await page.reload({waitUntil: 'networkidle'});
      await page.waitForTimeout(500);
      expect(url).toContain(u1);
    });

    test('At zoom level 1, zooming in to 2', async () => {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      await zoomIn(page, 0, urlBase, '');
    });

    test('At zoom level 2, zooming in to 3', async () => {
      await zoomIn(page, 1, urlBase, '-437169.06273812056-2131770.3835407723531588.8747777491836987.55397510533');
    });

    test('At zoom level 3, zooming in to 4', async () => {
      await zoomIn(page, 0, urlBase, '');
    });

    test('At zoom level 4, zooming in to 5', async () => {
      await zoomIn(page, 0, urlBase, '');
    });

    test('Panning makes new request as needed', async () => {
      await page.keyboard.press('Minus');
      await page.waitForTimeout(1000);
      
      let u = '';
      const listener = (request) => {
        if (request.url().includes(urlBase)) {
          u = request.url();
        }
      };
      page.on('request', listener);
      await page.keyboard.press('ArrowUp');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      page.off('request', listener);

      expect(u).toContain(panU);
    });
  });
});
