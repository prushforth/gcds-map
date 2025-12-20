 1) src/components/map-feature/test/featureLinks.e2e.ts:41:9 › Feature Links Tests › Sub Part Link Tests › Sub-point inplace link adds new layer, parent feature has separate link 

    Error: page.$eval: Failed to find element matching selector "//html/body/gcds-map/map-layer[2]"

      62 |       await page.keyboard.press('Enter'); // Press enter on the point of the 'Inplace' feature
      63 |       await page.waitForTimeout(1000);
    > 64 |       const layerName = await page.$eval(
         |                                    ^
      65 |         '//html/body/gcds-map/map-layer[2]',
      66 |         (layer) => layer.label
      67 |       );
        at /home/prushfor/github/gcds-map/src/components/map-feature/test/featureLinks.e2e.ts:64:36

    Error Context: test-results/components-map-feature-tes-3bfbf-t-feature-has-separate-link/error-context.md

  2) src/components/map-feature/test/featureLinks.e2e.ts:87:9 › Feature Links Tests › Main Part Link Tests › Main part adds new layer 

    Test timeout of 25000ms exceeded.

    Error: page.click: Target page, context or browser has been closed
    Call log:
      - waiting for locator('div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset:nth-child(2) > div:nth-child(1) > div > button:nth-child(1)')


      88 |       // remove the layer added by the previous test
      89 |       await page.hover('.leaflet-top.leaflet-right');
    > 90 |       await page.click(
         |                  ^
      91 |         'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset:nth-child(2) > div:nth-child(1) > div > button:nth-child(1)'
      92 |       );
      93 |       await page.waitForTimeout(850);
        at /home/prushfor/github/gcds-map/src/components/map-feature/test/featureLinks.e2e.ts:90:18

    Error Context: test-results/components-map-feature-tes-42a2f-ts-Main-part-adds-new-layer/error-context.md

  3) src/components/map-feature/test/linkTypes.e2e.ts:46:9 › Playwright Feature Links Tests › HTML Link Type Tests › HTML _blank target projection negotiation with hash 

    Error: expect(received).toEqual(expected) // deep equality

    - Expected  - 2
    + Received  + 2

      Object {
    -   "horizontal": -118.38250407225894,
    -   "vertical": 54.364895138267244,
    +   "horizontal": -108.64610089477709,
    +   "vertical": 45.25959378321073,
      }

      51 |       await page.waitForTimeout(1000);
      52 |       const extent = await page.$eval('body > gcds-map', (map) => (map as any).extent);
    > 53 |       expect(extent.topLeft.gcrs).toEqual({
         |                                   ^
      54 |         horizontal: -118.38250407225894,
      55 |         vertical: 54.364895138267244
      56 |       });
        at /home/prushfor/github/gcds-map/src/components/map-feature/test/linkTypes.e2e.ts:53:35

    Error Context: test-results/components-map-feature-tes-f4bc4-ction-negotiation-with-hash/error-context.md

  3 failed
    src/components/map-feature/test/featureLinks.e2e.ts:41:9 › Feature Links Tests › Sub Part Link Tests › Sub-point inplace link adds new layer, parent feature has separate link 
    src/components/map-feature/test/featureLinks.e2e.ts:87:9 › Feature Links Tests › Main Part Link Tests › Main part adds new layer 
    src/components/map-feature/test/linkTypes.e2e.ts:46:9 › Playwright Feature Links Tests › HTML Link Type Tests › HTML _blank target projection negotiation with hash 
  4 passed (40.5s)
prushfor@L-BSC-A146390:~/github/gcds-map (mapml-dev-dependency)