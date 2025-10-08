import { Component, Prop, State, Element, Watch, Method, h } from '@stencil/core';
import { setOptions, bounds, point } from 'leaflet';

import { Util } from '../utils/mapml/Util.js';
// Import the MapLayer module and access the factory function
import * as MapLayerModule from '../utils/mapml/layers/MapLayer.js';

/**
 * Map Layer component - refactored from mapml-source/src/map-layer.js
 * Uses composition instead of inheritance due to Stencil constraints
 */
@Component({
  tag: 'map-layer',
  shadow: true
})
export class MapLayer {
  @Element() el: HTMLElement;

  // Properties from original BaseLayerElement
  @Prop({ reflect: true, mutable: true }) src: string = '';
  @Prop({ reflect: true, mutable: true }) label: string = '';
  @Prop({ reflect: true, mutable: true }) checked: boolean = false;
  @Prop({ reflect: true, mutable: true }) hidden: boolean = false;
  @Prop({ reflect: true, mutable: true }) opacity: number = 1.0;
  @Prop({ reflect: true, mutable: true }) media: string;

  // Internal state
  @State() _layer: any;
  @State() _layerControl: any;
  @State() _layerControlHTML: any;
  @State() _opacity: number = 1.0;
  @State() _mql: MediaQueryList;
  @State() _changeHandler: () => void;
  @State() _observer: MutationObserver;
  @State() _fetchError: any;
  @State() disabled: boolean = false;

  // Layer control UI elements
  @State() _layerControlCheckbox: HTMLInputElement;
  @State() _layerControlLabel: HTMLElement;
  @State() _opacityControl: HTMLElement;
  @State() _opacitySlider: HTMLInputElement;
  @State() _styles: HTMLElement;

  private _hasConnected: boolean = false;

  @Watch('src')
  srcChanged(newValue: string, oldValue: string) {
    if (this._hasConnected && newValue !== oldValue) {
      this._onRemove();
      if (newValue) {
        this._onAdd();
      }
    }
  }

  @Watch('label')
  labelChanged(newValue: string, oldValue: string) {
    if (this._hasConnected && this._layer && newValue !== oldValue) {
      this._layer.setName(newValue);
      if (this._layerControl && !this.hidden) {
        this._layerControl.addOrUpdateOverlay(this._layer, newValue);
      }
    }
  }

  @Watch('checked')
  checkedChanged(newValue: boolean, oldValue: boolean) {
    if (this._hasConnected && this._layer && newValue !== oldValue) {
      if (newValue) {
        this._layer.addTo(this._layer._map);
      } else {
        this._layer._map.removeLayer(this._layer);
      }
    }
  }

  @Watch('hidden')
  hiddenChanged(newValue: boolean, oldValue: boolean) {
    if (this._hasConnected && this._layerControl && newValue !== oldValue) {
      if (newValue) {
        this._layerControl.removeLayer(this._layer);
      } else {
        this._layerControl.addOrUpdateOverlay(this._layer, this.label);
      }
    }
  }

  @Watch('opacity')
  opacityChanged(newValue: number, oldValue: number) {
    if (this._hasConnected && this._layer && newValue !== oldValue) {
      if (newValue >= 0 && newValue <= 1) {
        this._opacity = newValue;
        this._layer.setOpacity(newValue);
      }
    }
  }

  @Watch('media')
  mediaChanged(newValue: string, oldValue: string) {
    if (this._hasConnected && newValue !== oldValue) {
      this._registerMediaQuery(newValue);
    }
  }

  @Method()
  async getExtent() {
    if (this._layer) {
      this._layer._calculateBounds();
      const M = (window as any).M;
      return Object.assign(
        Util._convertAndFormatPCRS(
          this._layer.bounds,
          M[this.getProjection()],
          this.getProjection()
        ),
        { zoom: this._layer.zoomBounds }
      );
    }
    return null;
  }

  @Method()
  async zoomTo() {
    return this.whenReady().then(async () => {
      const map = (this.getMapEl() as any)?._map;
      const extent = await this.getExtent();
      if (map && extent) {
        const tL = extent.topLeft.pcrs;
        const bR = extent.bottomRight.pcrs;
        const layerBounds = bounds(
          point(tL.horizontal, tL.vertical),
          point(bR.horizontal, bR.vertical)
        );
        const center = map.options.crs.unproject(layerBounds.getCenter(true));
        const maxZoom = extent.zoom.maxZoom;
        const minZoom = extent.zoom.minZoom;
        map.setView(center, Util.getMaxZoom(layerBounds, map, minZoom, maxZoom), {
          animate: false
        });
      }
    });
  }

  @Method()
  async whenReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      let interval: NodeJS.Timeout;
      let failureTimer: NodeJS.Timeout;
      
      if (
        this._layer &&
        this._layerControlHTML &&
        (!this.src || this.el.shadowRoot?.childNodes.length)
      ) {
        resolve();
      } else {
        let count = 0;
        interval = setInterval(() => {
          count++;
          if (this._layer && this._layerControlHTML && (!this.src || this.el.shadowRoot?.childNodes.length)) {
            clearInterval(interval);
            clearTimeout(failureTimer);
            resolve();
          }
        }, 100);
        
        failureTimer = setTimeout(() => {
          clearInterval(interval);
          reject(new Error('Layer not ready after timeout'));
        }, 10000);
      }
    });
  }

  @Method()
  async queryable(): Promise<boolean> {
    const content = this.src ? this.el.shadowRoot : this.el;
    return !!(
      content?.querySelector('map-extent[checked] > map-link[rel=query]:not([disabled])') &&
      this.checked &&
      this._layer &&
      !this.hidden
    );
  }

  getMapEl() {
    // Find the closest gcds-map or mapml-viewer element
    let element = this.el.parentElement;
    while (element) {
      if (element.tagName === 'GCDS-MAP' || element.tagName === 'MAPML-VIEWER' || 
          (element.tagName === 'MAP' && element.hasAttribute('is'))) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  getProjection(): string {
    const mapml = this.src ? this.el.shadowRoot : this.el;
    let projection = (this.getMapEl() as any)?.projection || 'OSMTILE';
    
    const projectionMeta = mapml?.querySelector('map-meta[name=projection][content]');
    if (projectionMeta) {
      const content = Util._metaContentToObject(projectionMeta.getAttribute('content')).content;
      projection = content || projection;
    } else {
      const extentWithUnits = mapml?.querySelector('map-extent[units]');
      if (extentWithUnits) {
        projection = extentWithUnits.getAttribute('units');
      }
    }
    
    return projection;
  }

  private _registerMediaQuery(mq: string) {
    if (!this._changeHandler) {
      this._changeHandler = () => {
        this._onRemove();
        if (this._mql.matches) {
          this._onAdd();
        }
        this._validateDisabled();
      };
    }

    if (mq) {
      const map = this.getMapEl();
      if (!map) return;

      if (this._mql) {
        this._mql.removeEventListener('change', this._changeHandler);
      }

      this._mql = (map as any).matchMedia(mq);
      this._changeHandler();
      this._mql.addEventListener('change', this._changeHandler);
    } else if (this._mql) {
      this._mql.removeEventListener('change', this._changeHandler);
      delete this._mql;
      this._onRemove();
      this._onAdd();
      this._validateDisabled();
    }
  }

  private _onAdd() {
    return new Promise((resolve, reject) => {
      this.el.addEventListener('changestyle', (e) => {
        e.stopPropagation();
        // Handle style changes
      }, { once: true });

      const base = this.el.baseURI || document.baseURI;
      const headers = new Headers();
      headers.append('Accept', 'text/mapml');

      if (this.src) {
        // Fetch remote content
        const url = new URL(this.src, base);
        fetch(url.href, { headers })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.text();
          })
          .then(mapmlText => {
            const parser = new DOMParser();
            const mapmlDoc = parser.parseFromString(mapmlText, 'application/xml');
            this.copyRemoteContentToShadowRoot(mapmlDoc);
            this.selectAlternateOrChangeProjection();
            this._createLayer();
            resolve(null);
          })
          .catch(error => {
            this._fetchError = error;
            reject(error);
          });
      } else {
        // Local content
        this.selectAlternateOrChangeProjection();
        this._createLayer();
        resolve(null);
      }
    }).catch((e) => {
      if (e.message === 'changeprojection') {
        // Handle projection change
        if (e.cause?.href) {
          this.src = e.cause.href;
        } else if (e.cause?.mapprojection) {
          const mapEl = this.getMapEl() as any;
          if (mapEl) {
            mapEl.projection = e.cause.mapprojection;
          }
        }
      } else {
        console.error('Layer load error:', e);
        this._fetchError = e;
      }
    });
  }

  private _onRemove() {
    if (this._observer) {
      this._observer.disconnect();
    }

    const l = this._layer;
    const lc = this._layerControl;

    if (l) {
      l.off();
    }

    if (l && l._map) {
      l._map.removeLayer(l);
    }

    if (lc && !this.hidden) {
      lc.removeLayer(l);
    }

    delete this._layer;
    delete this._layerControl;
    delete this._layerControlHTML;
    delete this._fetchError;
    
    if (this.el.shadowRoot) {
      this.el.shadowRoot.innerHTML = '';
    }
    if (this.src) {
      this.el.innerHTML = '';
    }
  }

  private _createLayer() {
    // Create the MapML layer using the imported mapLayer factory function
    this._layer = (MapLayerModule as any).mapLayer(
      this.src || null, 
      this.src ? this.el.shadowRoot : this.el, 
      {
        opacity: this._opacity
      }
    );
    this._attachedToMap();
    this._bindMutationObserver();
  }

  private copyRemoteContentToShadowRoot(mapml: Document) {
    const shadowRoot = this.el.shadowRoot;
    const frag = document.createDocumentFragment();
    const elements = mapml.querySelectorAll('map-head > *, map-body > *');
    
    for (let i = 0; i < elements.length; i++) {
      frag.appendChild(elements[i].cloneNode(true));
    }
    shadowRoot.appendChild(frag);
  }

  private selectAlternateOrChangeProjection() {
    const mapml = this.src ? this.el.shadowRoot : this.el;
    const mapEl = this.getMapEl() as any;
    
    const selectedAlternate = 
      this.getProjection() !== mapEl?.projection &&
      mapml?.querySelector(
        `map-link[rel=alternate][projection=${mapEl?.projection}][href]`
      );

    if (selectedAlternate) {
      const url = new URL(
        selectedAlternate.getAttribute('href'),
        selectedAlternate.getAttribute('base') || this.el.baseURI
      ).href;
      throw new Error('changeprojection', {
        cause: { href: url }
      });
    }

    const contentProjection = this.getProjection();
    if (
      contentProjection !== mapEl?.projection &&
      mapEl?.layers?.length === 1
    ) {
      throw new Error('changeprojection', {
        cause: { mapprojection: contentProjection }
      });
    }
  }

  private _bindMutationObserver() {
    this._observer = new MutationObserver((mutationList) => {
      for (let mutation of mutationList) {
        if (mutation.type === 'childList') {
          this._runMutationObserver(
            Array.from(mutation.addedNodes)
              .filter(node => node.nodeType === Node.ELEMENT_NODE) as Element[]
          );
        }
      }
    });
    this._observer.observe(this.src ? this.el.shadowRoot : this.el, {
      childList: true
    });
  }

  private _runMutationObserver(elementsGroup: Element[]) {
    // Handle dynamic content changes - features, extents, styles, etc.
    for (let element of elementsGroup) {
      switch (element.nodeName) {
        case 'MAP-FEATURE':
          this.whenReady().then(() => {
            if (this._layer._mapmlvectors) {
              this._layer._mapmlvectors.addLayer((element as any)._feature);
            }
          });
          break;
        case 'MAP-EXTENT':
          this.whenReady().then(() => {
            if ((element as any)._templatedLayer) {
              this._layer.addLayer((element as any)._templatedLayer);
            }
          });
          break;
        // Add other cases as needed
      }
    }
  }

  private _attachedToMap() {
    // Set layer position and properties
    let position = 1;
    const siblings = this.el.parentNode?.children;
    if (siblings) {
      for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if ((sibling.nodeName === 'MAP-LAYER' || sibling.nodeName === 'LAYER-') && sibling !== this.el) {
          position++;
        } else if (sibling === this.el) {
          break;
        }
      }
    }

    const mapEl = this.getMapEl() as any;
    const proj = mapEl?.projection || 'OSMTILE';
    
    if (this._layer && mapEl?._map) {
      // Set layer options using Leaflet's setOptions
      setOptions(this._layer, {
        zIndex: position,
        mapprojection: proj,
        opacity: this.opacity
      });
      this._layer._map = mapEl._map;

      if (this.checked) {
        this._layer.addTo(mapEl._map);
      }

      this._layer.on('add remove', this._validateDisabled, this);
      mapEl._map.on('moveend layeradd', this._validateDisabled, this);

      if (mapEl._layerControl) {
        this._layerControl = mapEl._layerControl;
        if (!this.hidden) {
          this._layerControl.addOrUpdateOverlay(this._layer, this.label);
        }
      }
    }
  }

  private _validateDisabled() {
    setTimeout(() => {
      const layer = this._layer;
      const map = layer?._map;
      
      if (this._mql && !this._mql.matches) {
        this.disabled = true;
        return;
      }

      if (map && layer) {
        // Validate based on projection, zoom, bounds, etc.
        const mapProjection = (this.getMapEl() as any)?.projection;
        const layerProjection = this.getProjection();
        
        this.disabled = mapProjection !== layerProjection;
        this.toggleLayerControlDisabled();
      }
    }, 0);
  }

  private toggleLayerControlDisabled() {
    if (this._layerControlCheckbox) {
      this._layerControlCheckbox.disabled = this.disabled;
    }
    if (this._layerControlLabel) {
      this._layerControlLabel.style.fontStyle = this.disabled ? 'italic' : 'normal';
    }
    if (this._opacitySlider) {
      this._opacitySlider.disabled = this.disabled;
    }
    if (this._opacityControl) {
      this._opacityControl.style.fontStyle = this.disabled ? 'italic' : 'normal';
    }
    if (this._styles) {
      this._styles.style.fontStyle = this.disabled ? 'italic' : 'normal';
    }
  }

  connectedCallback() {
    if (this.el.hasAttribute('data-moving')) return;
    
    this._hasConnected = true;
    this._opacity = this.opacity || 1.0;

    const doConnected = this._onAdd.bind(this);
    const doRemove = this._onRemove.bind(this);
    const registerMediaQuery = this._registerMediaQuery.bind(this);
    const mq = this.media;

    const mapEl = this.getMapEl() as any;
    if (mapEl?.whenReady) {
      mapEl.whenReady()
        .then(() => {
          doRemove();
          if (mq) {
            registerMediaQuery(mq);
          } else {
            doConnected();
          }
        })
        .catch((error) => {
          throw new Error('Map never became ready: ' + error);
        });
    }
  }

  disconnectedCallback() {
    if (this.el.hasAttribute('data-moving')) return;
    
    this._onRemove();

    if (this._mql && this._changeHandler) {
      this._mql.removeEventListener('change', this._changeHandler);
      delete this._mql;
    }
  }

  render() {
    return <slot></slot>;
  }
}

