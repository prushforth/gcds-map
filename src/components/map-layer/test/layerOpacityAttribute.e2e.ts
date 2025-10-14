import { test, expect, chromium } from '@playwright/test';

test.describe('Test the map-layer opacity attribute', () => {
  let page;
  let context;
  test.beforeAll(async function () {
    context = await chromium.launchPersistentContext('');
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    await page.goto('/test/map-layer/layerOpacityAttribute.html');
    const l = await page.locator('map-layer');
    await l.evaluate((l) => l.whenReady());
  });
  test.afterAll(async function () {
    await context.close();
  });

  test('Setting Opacity Attibute to map-layer Element', async () => {
    let opacity_attribute_value = await page.$eval(
      'body > gcds-map > map-layer',
      (layer) => layer.getAttribute('opacity')
    );
    let layer_opacity = await page.$eval(
      'body > gcds-map > map-layer',
      (layer) => layer.opacity
    );
    expect(layer_opacity).toEqual(+opacity_attribute_value);
  });
  test('Layer control opacity slider reflected to map-layer.opacity property', async () => {
    let opacity_slider_value = await page.$eval(
      'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div:nth-child(2) > details > input[type=range]',
      (input) => input.value
    );
    let layer_opacity = await page.$eval(
      'body > gcds-map > map-layer',
      (layer) => layer.opacity
    );
    expect(layer_opacity).toEqual(+opacity_slider_value);
  });
  test('Changing layer control opacity slider updates map-layer.opacity', async () => {
    const opacitySlider = 'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div:nth-child(2) > details > input[type=range]';
    
    // Set slider to a specific value
    await page.$eval(opacitySlider, (slider) => {
      slider.value = '0.3';
      slider.dispatchEvent(new Event('change'));
    });
    
    // Wait a bit for the change to propagate
    await page.waitForTimeout(100);
    
    // Check that the layer.opacity property was updated
    const layerOpacity = await page.$eval(
      'body > gcds-map > map-layer',
      (layer) => layer.opacity
    );
    
    expect(layerOpacity).toEqual(0.3);
  });
  test('Changing layer control opacity slider does not update map-layer opacity attribute', async () => {
    const opacitySlider = 'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div:nth-child(2) > details > input[type=range]';
    
    // Get initial attribute value
    const initialAttribute = await page.$eval(
      'body > gcds-map > map-layer',
      (layer) => layer.getAttribute('opacity')
    );
    
    // Set slider to a different value
    await page.$eval(opacitySlider, (slider) => {
      slider.value = '0.5';
      slider.dispatchEvent(new Event('change'));
    });
    
    // Wait a bit for the change to propagate
    await page.waitForTimeout(100);
    
    // Check that the attribute was NOT changed (should remain the same as initial)
    const newAttribute = await page.$eval(
      'body > gcds-map > map-layer',
      (layer) => layer.getAttribute('opacity')
    );
    
    // The attribute should NOT change when slider is moved
    expect(newAttribute).toEqual(initialAttribute);
    
    // But the property should have changed
    const layerOpacity = await page.$eval(
      'body > gcds-map > map-layer',
      (layer) => layer.opacity
    );
    expect(layerOpacity).toEqual(0.5);
  });
  test('Changing map-layer.opacity value updates the layer control opacity slider value', async () => {
    const opacitySlider = 'div > div.leaflet-control-container > div.leaflet-top.leaflet-right > div > section > div.leaflet-control-layers-overlays > fieldset > div:nth-child(2) > details > input[type=range]';
    
    // Set the layer opacity property programmatically
    await page.$eval(
      'body > gcds-map > map-layer',
      (layer) => {
        layer.opacity = 0.6;
      }
    );
    
    // Wait a bit for the change to propagate
    await page.waitForTimeout(100);
    
    // Check that the slider value was updated
    const sliderValue = await page.$eval(opacitySlider, (slider) => slider.value);
    
    expect(+sliderValue).toEqual(0.6);
  });
  test('Changing map-layer.opacity value sets the map-layer._layer container style.opacity value', async () => {
    // Set the layer opacity property programmatically
    await page.$eval(
      'body > gcds-map > map-layer',
      (layer) => {
        layer.opacity = 0.4;
      }
    );
    
    // Wait a bit for the change to propagate
    await page.waitForTimeout(100);
    
    // Check that the underlying layer container style was updated
    const layerContainerOpacity = await page.$eval(
      'body > gcds-map > map-layer',
      (layer) => {
        return layer._layer && layer._layer._container 
          ? layer._layer._container.style.opacity 
          : null;
      }
    );
    
    expect(+layerContainerOpacity).toEqual(0.4);
  });
});
