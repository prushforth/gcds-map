import { test } from '@playwright/test';

import * as isVisible from './general/isVisible';
import * as zoomLimit from './general/zoomLimit';
import * as extentProperty from './general/extentProperty';

let expectedPCRS = {
    topLeft: {
      horizontal: -180,
      vertical: 90
    },
    bottomRight: {
      horizontal: 180,
      vertical: -270
    }
  },
  expectedGCRS = {
    topLeft: {
      horizontal: -180,
      vertical: 90
    },
    bottomRight: {
      horizontal: 180,
      vertical: -270
    }
  };

test.describe('Playwright mapMLTemplatedTile Layer Tests - General', () => {
  isVisible.test('/test/map-layer/templatedTileLayer.html', 2, 2);
  zoomLimit.test('/test/map-layer/templatedTileLayer.html', 1, 0);
  extentProperty.test('/test/map-layer/templatedTileLayer.html', expectedPCRS, expectedGCRS);
});
