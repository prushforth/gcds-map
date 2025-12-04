import { test } from '@playwright/test';

const isVisible = require('./general/isVisible');
const zoomLimit = require('./general/zoomLimit');
const extentProperty = require('./general/extentProperty');

const expectedPCRS = {
  topLeft: {
    horizontal: -34655800,
    vertical: 39310000
  },
  bottomRight: {
    horizontal: 14450964.88019643,
    vertical: -9796764.88019643
  }
};

const expectedGCRS = {
  topLeft: {
    horizontal: -169.78391348558873,
    vertical: -60.79113663130127
  },
  bottomRight: {
    horizontal: 79.6961805581841,
    vertical: -60.79110984572508
  }
};

test.describe('Playwright featureLayer General Tests', () => {
  isVisible.test('/test/map-layer/featureLayer.html', 5, 2);
  zoomLimit.test('/test/map-layer/featureLayer.html', 3, 1);
  extentProperty.test('/test/map-layer/featureLayer.html', expectedPCRS, expectedGCRS);
});
