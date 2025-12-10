import { test } from '@playwright/test';

import * as isVisible from './general/isVisible';
import * as zoomLimit from './general/zoomLimit';
import * as extentProperty from './general/extentProperty';

let expectedPCRS = {
    topLeft: {
      horizontal: 1501645.2210838948,
      vertical: -66110.70639331453
    },
    bottomRight: {
      horizontal: 1617642.4028044068,
      vertical: -222452.18449031282
    }
  },
  expectedGCRS = {
    topLeft: {
      horizontal: -76,
      vertical: 45.999999999999936
    },
    bottomRight: {
      horizontal: -74,
      vertical: 44.99999999999991
    }
  };

test.describe('Playwright templatedFeatures Layer Tests - General', () => {
  isVisible.test('/test/map-layer/templatedFeatures.html', 3, 2);
  zoomLimit.test('/test/map-layer/templatedFeatures.html', 2, 1);
  extentProperty.test('/test/map-layer/templatedFeatures.html', expectedPCRS, expectedGCRS);
});
