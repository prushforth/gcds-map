import { Component, Host, h, Prop, Element, State } from '@stencil/core';
import '@maps4html/mapml';
import type { MapMLViewerElement } from '../../gcds-map';

@Component({
  tag: 'gcds-map',
  styleUrl: 'gcds-map.css',
  shadow: true,
})
export class GcdsMap {
  @Element() el: HTMLElement;

  private mapmlViewer?: MapMLViewerElement;
  private layerObserver: MutationObserver;

  // Mirror mapml-viewer attributes - these are only used for initial render
  @Prop() projection?: string;
  @Prop() lat?: number;
  @Prop() lon?: number;
  @Prop() zoom?: number;
  @Prop() controls?: boolean = true;
  @Prop() controlslist?: string;
  @Prop() extent?: string;
  @Prop() width?: string;
  @Prop() height?: string;

  @State() layers: HTMLElement[] = [];

  componentWillLoad() {
    // Collect initial light DOM layers
    this.collectLayers();
  }

  componentDidLoad() {
    // Set up mutation observer to watch for layer changes only
    this.setupLayerObserver();
    // Store reference to mapml-viewer for future use
    if (this.mapmlViewer) {
      console.log('MapML viewer initialized');
    }
  }

  disconnectedCallback() {
    if (this.layerObserver) {
      this.layerObserver.disconnect();
    }
  }

  private setupLayerObserver() {
    this.layerObserver = new MutationObserver(() => {
      this.collectLayers();
    });

    this.layerObserver.observe(this.el, {
      childList: true,
      subtree: false
    });
  }

  private collectLayers() {
    const layers = Array.from(this.el.querySelectorAll('gcds-map-layer'));
    this.layers = [...layers];
  }

  render() {
    // Build the attributes object for initial render only
    const mapmlViewerAttrs: any = {};

    if (this.projection !== undefined) mapmlViewerAttrs.projection = this.projection;
    if (this.lat !== undefined) mapmlViewerAttrs.lat = this.lat;
    if (this.lon !== undefined) mapmlViewerAttrs.lon = this.lon;
    if (this.zoom !== undefined) mapmlViewerAttrs.zoom = this.zoom;
    if (this.controls !== undefined) mapmlViewerAttrs.controls = this.controls;
    if (this.controlslist !== undefined) mapmlViewerAttrs.controlslist = this.controlslist;
    if (this.extent !== undefined) mapmlViewerAttrs.extent = this.extent;

    // Let CSS handle the sizing, but provide defaults if specified
    const style: any = {};
    if (this.width) style.width = this.width;
    if (this.height) style.height = this.height;

    return (
      <Host>
        <mapml-viewer
          ref={(el) => this.mapmlViewer = el as MapMLViewerElement}
          {...mapmlViewerAttrs}
          style={style}
        >
          {this.layers.map(layer => (
            <map-layer
              checked={layer.hasAttribute('checked')}
              src={layer.getAttribute('src')}
              label={layer.getAttribute('label')}
              opacity={layer.getAttribute('opacity')}
            />
          ))}
        </mapml-viewer>
      </Host>
    );
  }
}
