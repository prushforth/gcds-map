# Refactoring Progress Tracker

This file tracks which MapML.js files have been refactored into GCDS components.

## Completed Refactoring

### Components
- [ ] `src/mapml-source/src/mapml-viewer.js` → `src/components/gcds-map/gcds-map.tsx` ✅
- [ ] `src/mapml-source/src/map-layer.js` → `src/components/map-layer/map-layer.tsx` ✅ 
- [ ] `src/mapml-source/src/map-extent.js` → `src/components/map-extent/map-extent.tsx` ✅
- [ ] `src/mapml-source/src/map-link.js` → `src/components/map-link/map-link.tsx` ✅
- [ ] `src/mapml-source/src/map-feature.js` → `src/components/map-feature/map-feature.tsx` ✅
- [ ] `src/mapml-source/src/map-geometry.js` → `src/components/map-geometry/map-geometry.tsx` ✅
- [ ] `src/mapml-source/src/map-properties.js` → `src/components/map-properties/map-properties.tsx` ✅
- [ ] `map-featurecaption` → `src/components/map-featurecaption/map-featurecaption.tsx` ✅

### Tests
- [ ] `src/mapml-source/test/e2e/core/mapElement.test.js` → `src/components/gcds-map/test/`
- [ ] `src/mapml-source/test/e2e/layers/layerContextMenu.test.js` → `src/components/gcds-map/test/ArrowKeyNavContextMenu.e2e.ts` ✅
- [ ] Add more test mappings as you refactor them...

## Pending Refactoring

### Components
- [ ] `src/mapml-source/src/map-area.js`
- [ ] `src/mapml-source/src/map-caption.js`
- [ ] `src/mapml-source/src/map-input.js`
- [ ] `src/mapml-source/src/map-meta.js`
- [ ] `src/mapml-source/src/map-select.js`
- [ ] `src/mapml-source/src/map-span.js`
- [ ] `src/mapml-source/src/map-style.js`
- [ ] `src/mapml-source/src/map-tile.js`

### Tests
- [ ] `src/mapml-source/test/e2e/` - Various test files to be mapped to component tests

## Notes
- Keep mapml-source as reference only - do not modify
- Each completed refactoring should maintain source correspondence for future diff/apply operations
- Tests should be migrated alongside their corresponding components