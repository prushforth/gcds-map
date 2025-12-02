 1) src/components/gcds-map/test/debugMode.e2e.ts:59:7 › Playwright Map Element Tests › Accurate debug coordinates 

    Error: expect(received).toEqual(expected) // deep equality

    Expected: "map: i: 250, j: 250"
    Received: "map: i: 252, j: 252"

      86 |     expect(tile).toEqual('tile: i: 141, j: 6');
      87 |     expect(matrix).toEqual('tilematrix: column: 3, row: 4');
    > 88 |     expect(map).toEqual('map: i: 250, j: 250');
         |                 ^
      89 |     expect(tcrs).toEqual('tcrs: x: 909, y: 1030');
      90 |     expect(pcrs).toEqual('pcrs: easting: 217676.00, northing: -205599.86');
      91 |     expect(gcrs).toEqual('gcrs: lon: -92.152897, lat: 47.114275');
        at /home/prushfor/github/gcds-map/src/components/gcds-map/test/debugMode.e2e.ts:88:17

    Error Context: test-results/components-gcds-map-test-d-bf434--Accurate-debug-coordinates/error-context.md

  1 failed
    src/components/gcds-map/test/debugMode.e2e.ts:59:7 › Playwright Map Element Tests › Accurate debug coordinates 
  16 skipped
  163 passed (1.6m)