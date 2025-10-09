# GCDS Map Component Development Guide

## Architecture Overview

This is a **Stencil-based fork** of MapML viewer technology that creates GCDS-compliant web map components. The architecture follows a **shadow DOM encapsulation pattern** with a critical **"set once"** property design.

### Key Components
- **`gcds-map`**: Main Stencil component that is a stencil refactoring of `mapml-viewer` from src/mapml-source/mapml-viewer.js
  - wraps a Leaflet map instance in its shadow DOM
  - manages map properties (lat, lon, zoom, etc.) some of which are set once at initialization by the user and then updated by the component as the view changes
  - the map-layer src attribute is not a "set once" attribute or property - it can be changed to load a different layer, or removed to change to local content
  - dynamically loads MapML controls to ensure proper Leaflet init hooks
 many other stencil components will be added via refactoring of the corresponding map-* components in MapML.js
- each map-* component in MapML.js will have a corresponding map-* stencil component here, of the same name except for the gcds-map component which will replace mapml-viewer.
- **MapML source**: Embedded copy of MapML.js library (`src/mapml-source/`) as a git submodule of this repo. This the "source" code that will be progressively refactored into gcds-* components. It is not involved in the build and should not be referenced or modified in this project

## Essential Development Patterns
- migrating and refactoring from mapml-source/**/*.js files to src/components/**/*.tsx files
- will try to keep / migrate the tests from the mapml-source/test/ folder to the corresponding src/components/gcds-* or map- component test folder, if possible
- the key reason to include the mapml-source as a submodule is to have access to the original source code for reference while refactoring. The maintenance of the gcds-map and other stencil map-* components will be done by using graphical diff / apply  changes if and where possible. Consequently, source order and correspondence of files and file names will be important while refactoring.


### "Set Once" Property Design
**CRITICAL**: Some map properties ( lat, lon, zoom) are passed to `gcds-map` during initial construction but **never allowed to be updated afterward** (they are written to as the map changes view, though). This design:
- Respects `mapml-viewer`'s internal state management and Leaflet integration

### MapML Integration Points
- **Global script**: `src/global/mapml-globals.js` - Sets up `window.M` and projections before any components load
- **Control loading**: Controls must be loaded via dynamic imports to register Leaflet init hooks (see `_ensureControlsLoaded()`)
- **Projection system**: Uses `window.M[projection]` CRS objects (OSMTILE, CBMTILE, etc.)

### Stencil Configuration Specifics
```typescript
// stencil.config.ts
globalScript: 'src/global/mapml-globals.js', // Loads MapML before components
taskQueue: 'async', // Required for MapML async operations
```

## Development Workflows

### Building & Testing
```bash
npm run build          # Stencil build
npm run start          # Dev server with watch
npm test              # Playwright e2e tests
npm run storybook     # Component development
```

### E2E Testing Pattern
Tests use custom HTML pages in `src/components/gcds-map/test/`. Key insight from `readme.txt`:
```bash
# Run specific test only (avoids Jest's max-workers conflict)
npx stencil test --e2e --no-build src/components/gcds-map/test/gcds-map.e2e.ts --silent --max-workers=8
```

### MapML Source Updates
MapML library is embedded in `src/mapml-source/`. When updating:
1. The source contains its own build system (Gruntfile.js, rollup.config.js)
2. CSS handling is complex - see commented sections in `stencil.config.ts`

## Key Files & Patterns

### Component Structure
- `src/components/gcds-map/gcds-map.tsx` - Main map wrapper
- `src/utils/mapml/` - MapML utilities (controls, handlers, etc.)

### Critical Methods
- `_createMap()` - Creates Leaflet map instance within shadow DOM container
- `_ensureControlsLoaded()` - Dynamically imports MapML controls to register init hooks
- `whenProjectionDefined()` - Ensures projection CRS is available before map creation

### Debugging Hooks
Components expose debugging references:
```javascript
(this.el as any)._map = this._map;           // Map instance on element
(window as any).__debugMap = this._map;      // Global debug access
```

## Integration Dependencies
- **GCDS Components**: Peer dependency for design system compliance
- **Leaflet**: Core mapping via MapML wrapper
- **Proj4Leaflet**: Coordinate system transformations
- **MapML.js**: Embedded library for web mapping standards as mapml-source as source for refactoring into gcds-* components

## Common Pitfalls
1. **Don't update map properties after initial render** - breaks coordinate system management
2. **Load controls via dynamic imports** - static imports may not register init hooks properly  e.g. zoom control
3. **CSS conflicts**: MapML CSS can conflict with Stencil styles - see shadow DOM isolation patterns
4. **Async timing**: Use `whenProjectionDefined()` before any map operations