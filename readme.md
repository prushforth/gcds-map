# gcds-map

A Government of Canada Design System (GCDS) plugin component that provides an accessible, standards-based web map viewer using [MapML](https://maps4html.org/web-map-doc/).

## Installation

```bash
npm install @cdssnc/gcds-map
```

### Peer Dependencies

This component requires the following peer dependencies:

```json
{
  "@cdssnc/gcds-components": "^x.x.x",
}
```

## Usage

### Basic Example

```html
<gcds-map projection="OSMTILE" lat="45.4215" lon="-75.6972" zoom="10">
  <gcds-map-layer checked src="https://geogratis.gc.ca/mapml/en/osmtile/osm/"></gcds-map-layer>
</gcds-map>
```

### With Multiple Layers

```html
<gcds-map projection="CBMTILE" lat="60.0" lon="-95.0" zoom="3" controls="true">
  <gcds-map-layer checked src="https://geogratis.gc.ca/mapml/en/cbmtile/cbmt/"></gcds-map-layer>
  <gcds-map-layer src="https://example.com/overlay.mapml" opacity="0.7"></gcds-map-layer>
</gcds-map>
```

## Components

### gcds-map

The <gcds-map> component wraps the [MapML viewer](https://maps4html.org/web-map-doc/).

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `projection` | `string` | `'OSMTILE'` | The coordinate reference system for the map (OSMTILE, CBMTILE, WGS84, APSTILE) |
| `lat` | `number` | - | Initial latitude center of the map |
| `lon` | `number` | - | Initial longitude center of the map |
| `zoom` | `number` | - | Initial zoom level |
| `controls` | `boolean` | `true` | Show/hide map controls |
| `controlslist` | `string` | - | Space-separated list of controls to show/hide |
| `extent` | `string` | - | Initial extent of the map view |
| `width` | `string` | `'100%'` | Width of the map |
| `height` | `string` | `'400px'` | Height of the map |

### gcds-map-layer

Represents a map layer to be displayed on the map.

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `checked` | `boolean` | `false` | Whether the layer is visible |
| `src` | `string` | - | URL to the MapML document |
| `label` | `string` | - | Label for the layer in the layer control |
| `opacity` | `string` | - | Opacity of the layer (0-1) |

## Architecture

The `gcds-map` component creates a shadow DOM that contains a `<mapml-viewer>` element. Light DOM `<gcds-map-layer>` children are transformed into `<map-layer>` elements within the shadow DOM, maintaining the declarative API while leveraging the MapML custom elements.

### Important Design Decision

The component follows a "set once" pattern for map properties. Initial attributes (projection, lat, lon, zoom, etc.) are passed to the `<mapml-viewer>` during render, but are never updated afterward. This approach:

- Respects the `mapml-viewer`'s internal state management and Leaflet integration
- (Hopefully)avoids timing conflicts between Stencil's lifecycle and custom element lifecycle
- Allows the MapML viewer to manage its own coordinate system and pixel relationships
- Lets browser rendering and CSS rules handle layout after initial creation

Only the layer list is dynamically updated when `<gcds-map-layer>` children change.

## Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

### Storybook

```bash
npm run storybook
```

## Accessibility

The component leverages the built-in accessibility features of the MapML viewer, including:
- Keyboard navigation
- Screen reader support
- ARIA labels and descriptions
- Focus management

## Browser Support

This component supports all browsers that support:
- Custom Elements v1
- Shadow DOM v1
- ES2017

## License

MIT License
