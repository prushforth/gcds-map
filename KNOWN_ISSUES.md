# Known Issues

## Layer Control - Extent Disappears After DOM Reordering

**Status**: Bug exists in both gcds-map and mapml-source  
**Discovered**: December 5, 2025 during test migration  
**Test**: `mixedLayer-zindex-rendering.e2e.ts` - Test #4 "DOM order change affects z-index rendering"

### Description
When a `map-extent` element is moved in the DOM via JavaScript manipulation (e.g., `insertBefore()`), the extent's entry disappears from the layer control panel, even though:
- The extent continues to render correctly on the map
- The z-index ordering updates properly based on new DOM position
- The extent's checked state is preserved

### Technical Details
When an extent is moved in the DOM:
1. `disconnectedCallback()` fires and removes `_layerControlHTML` from the layer control
2. `connectedCallback()` fires and creates new `_layerControlHTML` 
3. The new control HTML is **not** re-inserted into the parent layer's `_propertiesGroupAnatomy` fieldset
4. Result: Extent renders correctly but is missing from layer control

### Reproduction
```javascript
// Move extent after a feature in DOM
const firstFeature = document.querySelector('map-feature');
const firstExtent = document.querySelector('map-extent');
firstFeature.parentNode.insertBefore(firstExtent, firstFeature.nextSibling);
// Extent rendering updates correctly (z-index changes)
// But extent disappears from layer control panel
```

### Test Impact
The test `mixedLayer-zindex-rendering.e2e.ts` verifies rendering (screenshot) not layer control state, so the test passes. The bug was noticed during investigation when timeout needed adjustment for proper rendering update.

### Notes
- This is not a regression - mapml-source has the same behavior
- The `data-moving` attribute (used during layer control drag operations) properly prevents this issue during drag
- A fix would need to add insertion logic to `connectedCallback()` similar to the hidden attribute handler (lines 105-140 in map-extent.tsx)
- Investigate whether this is intended behavior or should be fixed in mapml-source upstream
