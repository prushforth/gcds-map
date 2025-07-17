// src/types/gcds-map.d.ts

export interface MapMLViewerElement extends HTMLElement {
  whenLayersReady: () => Promise<void>;
  layers: HTMLCollectionOf<Element>;
  defineCustomProjection: (projection: string) => void;
}

export interface MapLayerElement extends HTMLElement {
  src: string;
  checked: boolean;
}

// Global HTML element types for mapml-viewer
declare global {
  interface HTMLElementTagNameMap {
    'mapml-viewer': MapMLViewerElement;
    'map-layer': MapLayerElement;
  }
  
  interface HTMLMapmlViewerElement extends MapMLViewerElement {}
}

