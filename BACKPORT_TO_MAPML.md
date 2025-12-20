# Changes to Backport to MapML.js

This document tracks improvements and fixes made during the gcds-map refactoring that should be backported to the MapML.js source.

## Bug Fixes

### 1. map-caption Race Condition Fix
**File**: `src/map-caption.js`
**Issue**: Multiple map-caption elements race to set aria-label, causing non-deterministic behavior
**Fix**: 
- Add check to ensure only the first map-caption child manages the aria-label
- Use setTimeout to defer execution until after element hydration completes
- Only the first map-caption should set up MutationObserver and manage aria-label

**Code Changes**:
```javascript
connectedCallback() {
  if (this.parentElement.nodeName === 'MAPML-VIEWER' || this.parentElement.nodeName === 'WEB-MAP') {
    setTimeout(() => {
      // Only the first map-caption child should manage the aria-label
      const firstMapCaption = this.parentElement.querySelector('map-caption');
      const isFirstCaption = firstMapCaption === this;
      
      if (!isFirstCaption) {
        return;
      }
      
      // ... rest of existing logic
    }, 0);
  }
}
```

### 2. map-link type Attribute Default Behavior
**File**: `src/map-link.js`
**Issue**: The `type` property defaults to `'image/*'` which causes unwanted DOM attribute reflection
**Fix**:
- Remove default value from property setter
- Add getter that returns `'image/*'` as default when attribute is not present
- Prevents `type="image/*"` from appearing in DOM when not explicitly set by user

**Code Changes**:
```javascript
get type() {
  return this.getAttribute('type') || 'image/*';
}
```

### 3. MapFeatureLayer._validateRendering() Null Pointer Fix
**File**: `src/mapml/layers/MapFeatureLayer.js`
**Issue**: Crash with "Cannot read properties of null (reading 'replaceWith')" when geometry group's parentNode is null
**Root Cause**: 
- During `map-feature.reRender()`, a new geometry is created with a detached SVG group element
- `addTo()` triggers `_validateRendering()` before `reRender()` attaches the group to DOM
- The placeholder lookup via `querySelector()` fails because `parentNode` is null

**Fix**: Add null check before attempting to find and replace placeholder
```javascript
// Only try to find placeholder if the geometry group has a parentNode
// If parentNode is null, the geometry is being handled by reRender()
// which will attach it to the DOM after _validateRendering completes
if (geometry.defaultOptions.group.parentNode) {
  let placeholder =
    geometry.defaultOptions.group.parentNode.querySelector(
      `span[id="${geometry._leaflet_id}"]`
    );
  if (placeholder) {
    placeholder.replaceWith(geometry.defaultOptions.group);
  }
}
```

**Location in _validateRendering()**: Lines ~417-430 in the block that handles re-adding geometries:
```javascript
} else if (
  !map.hasLayer(geometry) &&
  !geometry._map
) {
  this.addRendering(geometry);
  // Add the null check here before querySelector
  if (geometry.defaultOptions.group.parentNode) {
    // ... placeholder logic
  }
}
```

## Test Improvements

### 4. Use waitForURL() Instead of waitForTimeout() for Navigation Tests
**File**: `test/e2e/core/linkTypes.test.js` (and potentially other navigation tests)
**Issue**: Tests use arbitrary `waitForTimeout(2000)` to wait for page navigation
**Improvement**: Use `page.waitForURL()` for more reliable navigation waiting

**Why**:
- Waits for actual navigation to complete, not arbitrary timeout
- Fails fast if navigation doesn't happen or goes to wrong URL
- More reliable - doesn't depend on timing assumptions
- Faster - continues immediately when navigation completes

**Example**:
```javascript
// Before:
await page.keyboard.press('Enter');
await page.waitForTimeout(2000);
const url = await page.url();
expect(url).toEqual('https://geogratis.gc.ca/mapml/en/cbmtile/fdi/');

// After:
await page.keyboard.press('Enter');
await page.waitForURL('https://geogratis.gc.ca/mapml/en/cbmtile/fdi/');
const url = await page.url();
expect(url).toEqual('https://geogratis.gc.ca/mapml/en/cbmtile/fdi/');
```

**Files to Review**:
- `test/e2e/core/linkTypes.test.js` - navigation tests
- Any other tests using `waitForTimeout()` after actions that trigger navigation
- Look for patterns like: `press('Enter')` followed by `waitForTimeout()` followed by URL checks

## Architecture Improvements

### 5. Layer Registry for Child Layer Management
**Files**: `src/map-link.js`, `src/map-layer.js`, `src/map-extent.js`, `src/map-feature.js`
**Purpose**: Manage child Leaflet feature and tile layers within parent elements
**Implementation**:
- Add `_layerRegistry` Map to parent elements (map-link, map-layer, map-extent)
- Structure: `position -> {layer: layerInstance, count: number}`
- Track MapTileLayer and MapFeatureLayer instances by their z-index position
- Reference counting for features/tiles at each position
- Prevents duplicate layer creation and manages proper cleanup

**Key Concept**:
- Each map-feature or map-tile queries parent's `_layerRegistry` by its `position` property
- If entry exists, increment count and reuse existing layer
- If entry doesn't exist, create new layer and add to registry with count=1
- On removal, decrement count; delete entry when count reaches 0

**Benefits**:
- Proper layer lifecycle management
- Prevents memory leaks from orphaned Leaflet layers
- Enables efficient layer reuse for features/tiles at same position

### 4. TemplatedTileLayer.js Defensive Null Check
**File**: `src/mapml/layers/TemplatedTileLayer.js` line ~601
**Issue**: Code assumes `template.zoom` always exists and has `initialValue` property
**Fix**: Add null check before accessing `template.zoom.initialValue`

**Code Change**:
```javascript
} else if (col && row && template.zoom && !isNaN(template.zoom.initialValue)) {
```

### 5. Event Listener Binding Pattern for Drop/Dragover Handlers
**File**: `src/mapml-viewer.js` and `src/web-map.js`
**Issue**: Event listeners added without proper binding, making removal ineffective
**Current Problem**:
```javascript
_setUpEvents() {
  this.addEventListener('drop', this._dropHandler, false);
  this.addEventListener('dragover', this._dragoverHandler, false);
  // ...
}
_removeEvents() {
  this.removeEventListener('drop', this._dropHandler, false);  // Won't work!
  this.removeEventListener('dragover', this._dragoverHandler, false);  // Won't work!
}
```

**Fix**: Store bound handler references and use them consistently
```javascript
_setUpEvents() {
  // Store bound handlers for cleanup
  this._boundDropHandler = this._dropHandler.bind(this);
  this._boundDragoverHandler = this._dragoverHandler.bind(this);
  
  this.addEventListener('drop', this._boundDropHandler, false);
  this.addEventListener('dragover', this._boundDragoverHandler, false);
  // ...
}
_removeEvents() {
  if (this._map) {
    this._map.off();
  }
  if (this._boundDropHandler) {
    this.removeEventListener('drop', this._boundDropHandler, false);
  }
  if (this._boundDragoverHandler) {
    this.removeEventListener('dragover', this._boundDragoverHandler, false);
  }
}
```

**Why This Matters**:
- Without binding, `removeEventListener` cannot match the original handler
- Leads to memory leaks as handlers are never removed
- Important for elements that may be repeatedly connected/disconnected

## Testing Improvements

### 6. Stencil class="hydrated" Handling in Tests
**Files**: Various e2e test files
**Issue**: Stencil adds `class="hydrated"` at unpredictable positions in attributes
**Fix**: Strip `class="hydrated"` from HTML strings before comparison in tests

**Example**:
```javascript
let copyValue = await page.$eval('body > textarea#coord', (text) => text.value);
// Remove class="hydrated" which Stencil adds at unpredictable positions
copyValue = copyValue.replace(/\s*class="hydrated"/g, '');
```

## Notes

- All changes should be tested in MapML.js context before merging
- Some patterns (like Stencil lifecycle timing) may need adjustment for custom elements
- The `_layerRegistry` pattern is the most significant architectural improvement

### 6. Projection Change and Link Traversal Timing Fix
**Files**: `src/mapml/utils/Util.js` (_handleLink function), `src/mapml-viewer.js` (projection attributeChangedCallback)
**Issue**: When following a map-a link that changes projection, the map doesn't zoom to the new layer's extent correctly (stays at zoom 2 instead of zoom 0)
**Root Cause**: 
- Custom element's `attributeChangedCallback` for projection is synchronous
- Stencil's `@Watch` is async (microtask-based)
- In Stencil, `layer.zoomTo()` executes before projection change completes, using wrong zoom constraints
- In mapml-source, execution order is correct but could still fail due to async layeradd event handler

**Fix Part 1 - Util.js `_handleLink()` function's `postTraversalSetup()`**:
```javascript
function postTraversalSetup() {
  if (!link.inPlace && zoomTo) updateMapZoomTo(zoomTo);
  
  // Wait for projection change to complete before calling layer.zoomTo()
  // This ensures zoom constraints are set properly in projectionChanged
  // Use timeout fallback in case no projection change occurs
  const projectionChangePromise = new Promise(resolve => {
    const timeout = setTimeout(resolve, 5000); // Fallback if no projection change
    map.options.mapEl.addEventListener('map-projectionchange', () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
  
  // Wait for both layer.whenReady() and projection change before proceeding
  Promise.all([layer.whenReady(), projectionChangePromise]).then(() => {
    if (!link.inPlace && zoomTo)
      layer.parentElement.zoomTo(+zoomTo.lat, +zoomTo.lng, +zoomTo.z);
    else if (!link.inPlace) layer.zoomTo();
    if (opacity) layer.opacity = opacity;
    map.getContainer().focus();
  });
}
```

**Fix Part 2 - mapml-viewer.js projection attributeChangedCallback**:
After reconnecting layers but before restoring coordinates, add synchronous constraint setting for single-layer case:
```javascript
// After all layers reconnected, before this.zoomTo(lat, lon, zoom)
Promise.allSettled(layersReady).then(() => {
  // Skip restoration if there's only one layer - link traversal case where layer.zoomTo() should control zoom
  const layers = this.layers;
  if (layers.length === 1) {
    const layer = layers[0];
    if (layer.extent) {
      this._map.setMinZoom(layer.extent.zoom.minZoom);
      this._map.setMaxZoom(layer.extent.zoom.maxZoom);
    }
  }
  this.zoomTo(lat, lon, zoom);
  // ... rest of existing code
});
```

**Why Both Changes Are Needed**:
1. **Util.js change**: Ensures `layer.zoomTo()` waits for projection change to complete
   - Without this, `layer.zoomTo()` runs before constraints are set
   - 5000ms timeout handles cases where no projection change occurs
   
2. **mapml-viewer.js change**: Sets constraints synchronously for single-layer case
   - Handles race condition where `layer.zoomTo()` runs before async `layeradd` event handler
   - The `layeradd` event handler uses `whenLayersReady()` which is async
   - Single layer detection (`layers.length === 1`) indicates link traversal scenario
   - Without this, constraints remain at default values preventing zoom 0

**Test Changes**:
- Updated `test/e2e/core/projectionChange.test.js` expectations
- After following link with `target="_parent"`, map should be centered at layer's extent (0,0,0)
- Previous expectation that map stayed at original coordinates was incorrect

**Why This Fix Works**:
- Synchronous constraint setting in projection change ensures constraints ready before `layer.zoomTo()`
- Promise-based waiting in link handler ensures proper execution order
- Both changes work together to handle the timing properly in both mapml-source and Stencil

