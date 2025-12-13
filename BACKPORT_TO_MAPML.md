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

## Architecture Improvements

### 3. Layer Registry for Child Layer Management
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
