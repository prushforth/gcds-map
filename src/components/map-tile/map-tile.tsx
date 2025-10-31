import { Component, Prop, Element, Method, Watch } from '@stencil/core';
import { Util } from '../../mapml-source/src/mapml/utils/Util.js';
import { mapTileLayer } from '../../mapml-source/src/mapml/layers/MapTileLayer.js';
import { calculatePosition } from '../../mapml-source/src/mapml/elementSupport/layers/calculatePosition.js';

@Component({
  tag: 'map-tile',
  shadow: false
})
export class MapTile {
  @Element() el: HTMLElement;

  // "Set once" properties
  @Prop({ reflect: true }) row?: number;
  @Prop({ reflect: true }) col?: number;
  @Prop({ reflect: true }) zoom?: number;
  @Prop({ reflect: true }) src?: string;

  _parentEl: any;
  _tileLayer: any;
  _extent: any;

  @Watch('src')
  srcChanged(newValue: string, oldValue: string) {
    if (oldValue !== newValue) {
      if (this._extent) this._calculateExtent();
      if (this._tileLayer) {
        this._tileLayer.removeMapTile(this);
        this._tileLayer.addMapTile(this);
      }
    }
  }

  connectedCallback() {
    // Find parent element (handle shadow DOM)
    const parentNode = this.el.parentNode as HTMLElement;
    this._parentEl =
      parentNode.nodeName === 'MAP-LAYER' ||
      parentNode.nodeName === 'LAYER-' ||
      parentNode.nodeName === 'MAP-LINK'
        ? parentNode
        : (parentNode as any).host;

    // Preload image
    const imgObj = new Image();
    imgObj.src = this.src || '';

    this._createOrGetTileLayer();
  }
  disconnectedCallback() {
    if (this._tileLayer) {
      this._tileLayer.removeMapTile(this);
      if (this._tileLayer._mapTiles && this._tileLayer._mapTiles.length === 0) {
        this._tileLayer.remove();
        this._tileLayer = null;
        delete this._tileLayer;

        const entry = this?._parentEl?._layerRegistry?.get(this.position);
        if (entry) {
          entry.count--;
          if (entry.count === 0) {
              this._parentEl._layerRegistry.delete(this.position);
          }
        }
      }
    }
  }

  // "Set once" property pattern for row, col, zoom
  get rowValue() {
    return +this.row;
  }
  get colValue() {
    return +this.col;
  }
  get zoomValue() {
    return +this.zoom;
  }

  get extent() {
    if (!this._extent) this._calculateExtent();
    return this._extent;
  }

  get position() {
    return calculatePosition(this.el);
  }

  isFirst() {
    return !this._parentEl._layerRegistry.has(this.position);
  }

  getPrevious() {
    if (this.isFirst()) return null;
    return this.el.previousElementSibling;
  }

  @Method()
  async zoomTo() {
    const extent = this.extent;
    const map = this.getMapEl()?._map;
    if (!extent || !map) return;
    const xmin = extent.topLeft.pcrs.horizontal,
      xmax = extent.bottomRight.pcrs.horizontal,
      ymin = extent.bottomRight.pcrs.vertical,
      ymax = extent.topLeft.pcrs.vertical,
      bounds = (window as any).L.bounds((window as any).L.point(xmin, ymin), (window as any).L.point(xmax, ymax)),
      center = map.options.crs.unproject(bounds.getCenter(true)),
      maxZoom = extent.zoom.maxZoom,
      minZoom = extent.zoom.minZoom;
    map.setView(center, Util.getMaxZoom(bounds, map, minZoom, maxZoom), { animate: false });
  }

  getMapEl() {
    return Util.getClosest(this.el, 'gcds-map,mapml-viewer,map[is=web-map]');
  }

  getLayerEl() {
    return Util.getClosest(this.el, 'map-layer,layer-');
  }

  getMeta(metaName: string) {
    const name = metaName.toLowerCase();
    if (name !== 'cs' && name !== 'zoom' && name !== 'projection') return;
    const sdMeta = this._parentEl?.shadowRoot?.querySelector(`map-meta[name=${name}][content]`);
    if (this._parentEl?.nodeName === 'MAP-LINK') {
      return sdMeta || this._parentEl.parentElement?.getMeta(metaName);
    } else {
      return this._parentEl?.src
        ? this._parentEl.shadowRoot?.querySelector(`map-meta[name=${name}][content]`)
        : this._parentEl.querySelector(`map-meta[name=${name}][content]`);
    }
  }

  private async _createOrGetTileLayer() {
    if (!this._parentEl?.whenReady) return;
    await this._parentEl.whenReady();
    const parentElement = this._parentEl;
    if (this.isFirst()) {

      this._tileLayer = mapTileLayer({
        projection: this.getMapEl()?.projection,
        opacity: 1,
        pane:
          parentElement._templatedLayer?.getContainer?.() ||
          parentElement._layer?.getContainer?.(),
        zIndex: this.position
      });
      this._tileLayer.addMapTile(this);
      if (parentElement._templatedLayer?.addLayer) {
        parentElement._templatedLayer.addLayer(this._tileLayer);
      } else {
        parentElement._layer?.addLayer?.(this._tileLayer);
      }
      // Add this position to the parent's _layerRegistry with layer reference and count = 1
      parentElement._layerRegistry.set(this.position, { layer: this._tileLayer, count: 1 });
    } else {
      // get the previously registered TileLayer for this position
      const entry = parentElement._layerRegistry.get(this.position);

      this._tileLayer = entry?.layer;
      if (entry) {
        entry.count++;
      }
      if (this._tileLayer) {
        this._tileLayer.addMapTile(this);
      }
    }
  }

  private _calculateExtent() {
    const mapEl = this.getMapEl();
    if (!mapEl || !mapEl._map) return;
    const map = mapEl._map;
    const projection = map.options.projection;
    const tileSize = (window as any).M[projection].options.crs.tile.bounds.max.x;
    const pixelX = this.colValue * tileSize;
    const pixelY = this.rowValue * tileSize;
    const pixelBounds = (window as any).L.bounds(
      (window as any).L.point(pixelX, pixelY),
      (window as any).L.point(pixelX + tileSize, pixelY + tileSize)
    );
    const pcrsBounds = Util.pixelToPCRSBounds(pixelBounds, this.zoomValue, projection);
    this._extent = Util._convertAndFormatPCRS(pcrsBounds, map.options.crs, projection);
    this._extent.zoom = {
      minZoom: this.zoomValue,
      maxZoom: this.zoomValue,
      minNativeZoom: this.zoomValue,
      maxNativeZoom: this.zoomValue
    };
  }

  render() {
    // This component does not render any visible DOM
    return null;
  }
}
