import { test } from '@playwright/test';

import * as isVisible from './general/isVisible';
import * as zoomLimit from './general/zoomLimit';
import * as extentProperty from './general/extentProperty';

let expectedPCRS = {
    topLeft: {
      horizontal: -6207743.103886206,
      vertical: 3952277.216154434
    },
    bottomRight: {
      horizontal: 3952277.216154434,
      vertical: -3362085.3441706896
    }
  },
  expectedGCRS = {
    topLeft: {
      horizontal: -136.9120743861578,
      vertical: 54.8100849543377
    },
    bottomRight: {
      horizontal: -6.267177352336376,
      vertical: 6.5831982143623975
    }
  };

test.describe('Playwright templatedImage Layer Tests - General', () => {
  isVisible.test('/test/map-layer/templatedImageLayer.html', 2, 2);
  zoomLimit.test('/test/map-layer/templatedImageLayer.html', 1, 0);
  extentProperty.test('/test/map-layer/templatedImageLayer.html', expectedPCRS, expectedGCRS);
});
