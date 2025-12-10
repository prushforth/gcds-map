import { test } from '@playwright/test';

import * as isVisible from './general/isVisible';
import * as zoomLimit from './general/zoomLimit';
import * as extentProperty from './general/extentProperty';

let expectedPCRS = {
    topLeft: {
      horizontal: -4175739.0398780815,
      vertical: 5443265.599864535
    },
    bottomRight: {
      horizontal: 5984281.280162558,
      vertical: -1330081.280162558
    }
  },
  expectedGCRS = {
    topLeft: {
      horizontal: -133.75137103791573,
      vertical: 36.915777752306546
    },
    bottomRight: {
      horizontal: 13.251318374931316,
      vertical: 26.63127363018255
    }
  };

test.describe('Playwright StaticTile Layer Tests - General', () => {
  isVisible.test('/test/map-layer/staticTileLayer.html', 3, 3);
  zoomLimit.test('/test/map-layer/staticTileLayer.html', 2, 2);
  extentProperty.test('/test/map-layer/staticTileLayer.html', expectedPCRS, expectedGCRS);
});
