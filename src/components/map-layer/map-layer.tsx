import { Component, Prop, State, Element, Watch, Method } from '@stencil/core';
import { setOptions } from 'leaflet';
import { Util } from '../utils/mapml/Util.js';
import * as MapLayerModule from '../utils/mapml/layers/MapLayer.js';

@Component({
  tag: 'map-layer',
  shadow: true
})
export class MapLayerStencil {
  @Element() el: HTMLElement;

  // Core properties matching BaseLayerElement observedAttributes
  @Prop({ reflect: true, mutable: true }) src?: string;
  @Prop({ reflect: true, mutable: true }) label?: string;
  @Prop({ reflect: true, mutable: true }) checked?: boolean;
  // Note: hidden is a standard HTML attribute, handled via attributeChangedCallback
  @Prop({ reflect: true, mutable: true }) opacity?: number;
  @Prop({ reflect: true, mutable: true }) media?: string;

  // Internal state
  @State() _layer: any;
  @State() _layerControl: any;
  @State() _opacity: number = 1.0;
  @State() disabled: boolean = false;

  private loggedMessages: Set<unknown>;

  // Note: Stencil handles constructor automatically, but we can use componentWillLoad for initialization
  componentWillLoad() {
    // Mirror the original constructor logic
    this._opacity = this.opacity || 1.0;
    // by keeping track of console.log, we can avoid overwhelming the console
    this.loggedMessages = new Set();
  }
  componentDidLoad() {
    // Expose methods on the DOM element for MapML compatibility using Object.defineProperty
    try {
      Object.defineProperty(this.el, 'zoomTo', {
        value: () => this.zoomTo(),
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(this.el, 'getProjection', {
        value: () => this.getProjection(),
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(this.el, 'getOuterHTML', {
        value: () => this.getOuterHTML(),
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(this.el, 'whenReady', {
        value: () => this.whenReady(),
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(this.el, 'getAlternateStyles', {
        value: (styleLinks: NodeList | HTMLElement[]) => this.getAlternateStyles(styleLinks),
        writable: true,
        configurable: true
      });
      
      // Expose _layer property for MapML compatibility
      Object.defineProperty(this.el, '_layer', {
        get: () => this._layer,
        configurable: true,
        enumerable: true
      });
      
      // Expose _layerControl property for MapML compatibility
      Object.defineProperty(this.el, '_layerControl', {
        get: () => this._layerControl,
        set: (value) => { this._layerControl = value; },
        configurable: true,
        enumerable: true
      });
      
      // Expose _opacity property for MapML compatibility
      Object.defineProperty(this.el, '_opacity', {
        get: () => this.opacity ?? 1.0,
        set: (value) => { 
          this.opacity = parseFloat(value);
          // Update the attribute to reflect the change
          this.el.setAttribute('opacity', this.opacity.toString());
        },
        configurable: true,
        enumerable: true
      });
      
      // Expose _fetchError property for MapML compatibility
      Object.defineProperty(this.el, '_fetchError', {
        get: () => this._fetchError,
        set: (value) => { this._fetchError = value; },
        configurable: true,
        enumerable: true
      });
      
      // Expose _opacitySlider property for MapML compatibility
      Object.defineProperty(this.el, '_opacitySlider', {
        get: () => (this.el as any).__opacitySlider,
        set: (value) => { (this.el as any).__opacitySlider = value; },
        configurable: true,
        enumerable: true
      });
      
      // Expose _layerControlCheckbox property for MapML compatibility
      Object.defineProperty(this.el, '_layerControlCheckbox', {
        get: () => (this.el as any).__layerControlCheckbox,
        set: (value) => { (this.el as any).__layerControlCheckbox = value; },
        configurable: true,
        enumerable: true
      });
    } catch (error) {
      console.warn('Could not expose methods on element:', error);
      // Fallback: try later in componentDidRender
    }
    
    // Set up observer for hidden attribute changes (since it's a standard HTML attribute)
    this._setupHiddenAttributeObserver();
    
  }

  async componentDidRender() {
    // Initialize the layer after parent map has fully rendered
    if (!this._layerInitialized && !this._initializingLayer) {
      this._initializingLayer = true;
      
      const mapEl = this.getMapEl();
      if (mapEl) {
        try {
          // Wait for parent map to be ready
          await this._waitForParentMapReady(mapEl);
          
          // Handle media query if present
          if (this.media) {
            this._registerMediaQuery(this.media);
          } else {
            await this._onAdd();
          }
          
          this._layerInitialized = true;
        } catch (error) {
          console.error('Map initialization failed:', error);
        }
      } else {
        console.warn('Parent map element not found');
      }
      
      this._initializingLayer = false;
    }

    // Additional attempt to expose methods if componentDidLoad failed
    if (!(this.el as any).zoomTo) {
      try {
        Object.defineProperty(this.el, 'zoomTo', {
          value: () => this.zoomTo(),
          writable: true,
          configurable: true
        });
        
        Object.defineProperty(this.el, 'getProjection', {
          value: () => this.getProjection(),
          writable: true,
          configurable: true
        });
        
        Object.defineProperty(this.el, 'getOuterHTML', {
          value: () => this.getOuterHTML(),
          writable: true,
          configurable: true
        });
        
        Object.defineProperty(this.el, 'whenReady', {
          value: () => this.whenReady(),
          writable: true,
          configurable: true
        });
        
        Object.defineProperty(this.el, 'getAlternateStyles', {
          value: (styleLinks: NodeList | HTMLElement[]) => this.getAlternateStyles(styleLinks),
          writable: true,
          configurable: true
        });
        
        // Expose _layer property for MapML compatibility
        Object.defineProperty(this.el, '_layer', {
          get: () => this._layer,
          configurable: true,
          enumerable: true
        });
        
        // Expose _layerControl property for MapML compatibility
        Object.defineProperty(this.el, '_layerControl', {
          get: () => this._layerControl,
          set: (value) => { this._layerControl = value; },
          configurable: true,
          enumerable: true
        });
        
        // Expose _opacity property for MapML compatibility
        Object.defineProperty(this.el, '_opacity', {
          get: () => this.opacity ?? 1.0,
          set: (value) => { 
            this.opacity = parseFloat(value);
            // Update the attribute to reflect the change
            this.el.setAttribute('opacity', this.opacity.toString());
          },
          configurable: true,
          enumerable: true
        });
        
        // Expose _fetchError property for MapML compatibility
        Object.defineProperty(this.el, '_fetchError', {
          get: () => this._fetchError,
          set: (value) => { this._fetchError = value; },
          configurable: true,
          enumerable: true
        });
        
        // Expose _opacitySlider property for MapML compatibility
        Object.defineProperty(this.el, '_opacitySlider', {
          get: () => (this.el as any).__opacitySlider,
          set: (value) => { (this.el as any).__opacitySlider = value; },
          configurable: true,
          enumerable: true
        });
        
        // Expose _layerControlCheckbox property for MapML compatibility
        Object.defineProperty(this.el, '_layerControlCheckbox', {
          get: () => (this.el as any).__layerControlCheckbox,
          set: (value) => { (this.el as any).__layerControlCheckbox = value; },
          configurable: true,
          enumerable: true
        });
      } catch (error) {
        console.warn('Still could not expose methods on element in componentDidRender:', error);
      }
    }
  }

  // Watchers for attribute changes - these automatically don't fire during initial load
  @Watch('src')
  srcChanged(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      console.log('Source changed:', newValue);
      // Implementation will be added later
    }
  }

  @Watch('checked')
  checkedChanged(newValue: boolean) {
    if (this._layer) {
      
      // Get the parent map element
      const mapEl = this.el.closest('gcds-map') as HTMLElement;
      if (mapEl && (mapEl as any)._map) {
        const leafletMap = (mapEl as any)._map;
        
        if (newValue) {
          // If checked is true, add the layer to the map
          leafletMap.addLayer(this._layer);
        } else {
          // If checked is false, remove the layer from the map
          leafletMap.removeLayer(this._layer);
        }
      }
      
      // Update the layer control checkbox to match the checked state
      const checkbox = (this.el as any).__layerControlCheckbox;
      if (checkbox) {
        checkbox.checked = newValue;
      }
    }
  }

  @Watch('opacity')
  opacityChanged(newValue: number) {
    if (this._layer && newValue !== undefined) {
      // Update the layer opacity via MapML's changeOpacity method
      this._layer.changeOpacity(newValue);
    }
  }

  // Handle hidden attribute changes via mutation observer or custom implementation
  private _hiddenChangeHandler(newValue: boolean) {
    if (this._layer && this._layerControl) {
      console.log('Hidden changed:', newValue);
      
      if (newValue) {
        // If hidden is true, remove the layer from the layer control
        this._layerControl.removeLayer(this._layer);
      } else {
        // If hidden is false, add the layer back to the layer control and validate disabled state
        this._layerControl.addOrUpdateOverlay(this._layer, this.label);
        this._validateDisabled();
      }
    }
  }

  getMapEl() {
    return Util.getClosest(this.el, 'gcds-map');
  }

  /**
   * For "local" content, getProjection will use content of "this"
   * For "remote" content, you need to pass the shadowRoot to search through
   */
  getProjection() {
    let mapml = this.src ? this.el.shadowRoot : this.el;
    let projection = this.getMapEl().projection;
    if (mapml.querySelector('map-meta[name=projection][content]')) {
      projection =
        Util._metaContentToObject(
          mapml
            .querySelector('map-meta[name=projection]')
            .getAttribute('content')
        ).content || projection;
    } else if (mapml.querySelector('map-extent[units]')) {
      const getProjectionFrom = (extents) => {
        let extentProj = extents[0].attributes.units.value;
        let isMatch = true;
        for (let i = 0; i < extents.length; i++) {
          if (extentProj !== extents[i].attributes.units.value) {
            isMatch = false;
          }
        }
        return isMatch ? extentProj : null;
      };
      projection =
        getProjectionFrom(
          Array.from(mapml.querySelectorAll('map-extent[units]'))
        ) || projection;
    } else {
      const message = `A projection was not assigned to the '${this.label || this.el.querySelector('map-title').textContent}' Layer. \nPlease specify a projection for that layer using a map-meta element. \nSee more here - https://maps4html.org/web-map-doc/docs/elements/meta/`;
      if (!this.loggedMessages.has(message)) {
        console.log(message);
        this.loggedMessages.add(message);
      }
    }
    return projection;
  }

  @Method()
  async zoomTo() {
    console.log('zoomTo called for layer:', this.label);
  }

  @Method()
  async getOuterHTML(): Promise<string> {
    return this.el.outerHTML;
  }

  getAlternateStyles(styleLinks: NodeList | HTMLElement[]): HTMLElement | null {
    // Implementation based on the original layer.js getAlternateStyles method
    if (styleLinks.length > 1) {
      const stylesControl = document.createElement('details');
      const stylesControlSummary = document.createElement('summary');
      const mapEl = this.getMapEl();
      
      stylesControlSummary.innerText = (mapEl as any)?.locale?.lmStyle || 'Style';
      stylesControl.appendChild(stylesControlSummary);

      for (let j = 0; j < styleLinks.length; j++) {
        const styleLink = styleLinks[j] as any;
        if (styleLink.getLayerControlOption) {
          stylesControl.appendChild(styleLink.getLayerControlOption());
        }
        stylesControl.classList.add('mapml-layer-item-style', 'mapml-control-layers');
      }
      return stylesControl;
    }
    return null;
  }

  @Method()
  async whenReady(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let interval: any, failureTimer: any;
      if (
        (this.el as any)._layer &&
        this._layerControlHTML &&
        (!this.src || this.el.shadowRoot?.childNodes.length)
      ) {
        resolve();
      } else {
        const layerElement = this.el;
        interval = setInterval(testForLayer, 200, layerElement);
        failureTimer = setTimeout(layerNotDefined, 5000);
      }

      function testForLayer(layerElement: any) {
        if (
          layerElement._layer &&
          layerElement._layerControlHTML &&
          (!layerElement.src || layerElement.shadowRoot?.childNodes.length)
        ) {
          clearInterval(interval);
          clearTimeout(failureTimer);
          resolve();
        } else if (layerElement._fetchError) {
          clearInterval(interval);
          clearTimeout(failureTimer);
          reject('Error fetching layer content');
        }
      }
      
      function layerNotDefined() {
        clearInterval(interval);
        clearTimeout(failureTimer);
        reject('Timeout reached waiting for layer to be ready');
      }
    });
  }

  private _fetchError: boolean = false;
  private _layerControlHTML: any;
  private _layerInitialized: boolean = false;
  private _initializingLayer: boolean = false;

  private async _waitForParentMapReady(mapEl: HTMLElement): Promise<void> {
    // Wait for parent map to have its Leaflet _map instance created
    return new Promise((resolve, reject) => {
      const maxAttempts = 50; // 5 seconds max
      let attempts = 0;
      
      const checkReady = () => {
        attempts++;
        
        // Check if the parent gcds-map has created its Leaflet map instance
        if ((mapEl as any)._map && typeof (mapEl as any)._map.addLayer === 'function') {
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          reject(new Error('Timeout waiting for parent map Leaflet instance to be created'));
          return;
        }
        
        // Wait 100ms and try again
        setTimeout(checkReady, 100);
      };
      
      checkReady();
    });
  }

  private _registerMediaQuery(mq: string) {
    // TODO: Implement media query registration
    console.log('Media query registration not yet implemented:', mq);
  }

  private _copyRemoteContentToShadowRoot(mapml: any) {
    // Copy remote MapML content to shadow DOM
    const shadowRoot = this.el.shadowRoot;
    if (!shadowRoot || !mapml) return;
    
    const frag = document.createDocumentFragment();
    const elements = mapml.querySelectorAll('map-head > *, map-body > *');
    for (let i = 0; i < elements.length; i++) {
      frag.appendChild(elements[i]);
    }
    shadowRoot.appendChild(frag);
  }

  private _selectAlternateOrChangeProjection() {
    const mapml = this.src ? this.el.shadowRoot : this.el;
    const mapEl = this.getMapEl();
    
    if (!mapml || !mapEl) return;
    
    const selectedAlternate = 
      this.getProjection() !== (mapEl as any).projection &&
      mapml.querySelector(
        'map-link[rel=alternate][projection=' +
          (mapEl as any).projection +
          '][href]'
      );

    if (selectedAlternate) {
      const url = new URL(
        selectedAlternate.getAttribute('href'),
        selectedAlternate.baseURI || document.baseURI
      ).href;
      throw new Error('changeprojection', {
        cause: { href: url }
      });
    }
    
    const contentProjection = this.getProjection();
    if (
      contentProjection !== (mapEl as any).projection &&
      (mapEl as any).layers?.length === 1
    ) {
      throw new Error('changeprojection', {
        cause: { mapprojection: contentProjection }
      });
    }
  }

  private async _createLayerControlHTML() {
    // Import and create layer control HTML
    const { createLayerControlHTML } = await import('../utils/mapml/elementSupport/layers/createLayerControlForLayer.js');
    
    // This prevents the "Cannot read properties of null (reading 'shadowRoot')" error
    // Note: _layer is already exposed via Object.defineProperty in componentDidLoad, so we don't set it here
    (this.el as any).label = this.label;
    (this.el as any).checked = this.checked;
    (this.el as any).src = this.src;
    
    // Call the function bound to the actual DOM element (this.el), just like in layer.js
    // The function expects 'this' to be the map-layer element, not the Stencil component
    this._layerControlHTML = await createLayerControlHTML.call(this.el);
  }

  private _setLocalizedDefaultLabel() {
    if (!this._layer?._titleIsReadOnly && !this._layer?._title) {
      const mapEl = this.getMapEl();
      if (mapEl && (mapEl as any).locale?.dfLayer) {
        this.label = (mapEl as any).locale.dfLayer;
      }
    }
  }

  private _attachedToMap() {
    // Refactored from layer.js _attachedToMap()
    // Set i to the position of this layer element in the set of layers
    const mapEl = this.getMapEl();
    if (!mapEl || !this._layer) return;

    let i = 0;
    let position = 1;
    const nodes = mapEl.children;
    
    for (i = 0; i < nodes.length; i++) {
      if (
        nodes[i].nodeName === 'MAP-LAYER' ||
        nodes[i].nodeName === 'LAYER-'
      ) {
        if (nodes[i] === this.el) {
          position = i + 1;
        } else if ((nodes[i] as any)._layer) {
          (nodes[i] as any)._layer.setZIndex(i + 1);
        }
      }
    }
    
    const proj = (mapEl as any).projection ? (mapEl as any).projection : 'OSMTILE';
    setOptions(this._layer, {
      zIndex: position,
      mapprojection: proj,
      opacity: window.getComputedStyle(this.el).opacity
    });

    if (this.checked) {
      this._layer.addTo((mapEl as any)._map);
      // Toggle the this.disabled attribute depending on whether the layer
      // is: same prj as map, within view/zoom of map
    }
    
    (mapEl as any)._map.on('moveend layeradd', this._validateDisabled, this);
    this._layer.on('add remove', this._validateDisabled, this);

    if ((mapEl as any)._layerControl) {
      this._layerControl = (mapEl as any)._layerControl;
      // Expose _layerControl on DOM element for MapML compatibility
      (this.el as any)._layerControl = this._layerControl;
    }
    
    // If controls option is enabled, insert the layer into the overlays array
    if ((mapEl as any)._layerControl && !this.el.hasAttribute('hidden')) {
      this._layerControl.addOrUpdateOverlay(this._layer, this.label);
    }

    // The mapml document associated to this layer can in theory contain many
    // link[@rel=legend] elements with different @type or other attributes;
    // currently only support a single link, don't care about type, lang etc.
    // TODO: add support for full LayerLegend object, and > one link.
    if (this._layer._legendUrl) {
      (this.el as any).legendLinks = [
        {
          type: 'application/octet-stream',
          href: this._layer._legendUrl,
          rel: 'legend',
          lang: null,
          hreflang: null,
          sizes: null
        }
      ];
    }
  }

  private _validateDisabled() {
    // Refactored from layer.js _validateDisabled() - simplified version
    // setTimeout is necessary to make the validateDisabled happen later than the moveend operations etc.,
    // to ensure that the validated result is correct
    setTimeout(() => {
      const layer = this._layer;
      const mapEl = this.getMapEl();
      const map = layer?._map;
      
      // If there's a media query in play, check it early
      if ((this as any)._mql && !(this as any)._mql.matches) {
        this.el.setAttribute('disabled', '');
        this.disabled = true;
        return;
      }
      
      if (map && mapEl) {
        // For now, implement basic validation logic
        // TODO: Implement full extent-based validation like the original
        
        // Get map extents - prerequisite: no inline and remote mapml elements exists at the same time
        const mapExtents = this.src
          ? this.el.shadowRoot?.querySelectorAll('map-extent')
          : this.el.querySelectorAll('map-extent');
        
        if (mapExtents && mapExtents.length > 0) {
          // Simplified: assume layer is enabled if it has extents and is checked
          // The full implementation would check each extent's visibility
          if (this.checked) {
            this.el.removeAttribute('disabled');
            this.disabled = false;
          } else {
            this.el.setAttribute('disabled', '');
            this.disabled = true;
          }
        } else {
          // No extents found, enable if checked
          if (this.checked) {
            this.el.removeAttribute('disabled');
            this.disabled = false;
          }
        }
        
        this.toggleLayerControlDisabled();
      }
    }, 0);
  }
  
  private toggleLayerControlDisabled() {
    // TODO: Implement layer control disable/enable functionality
    // This would disable/italicize layer control elements based on the disabled property
  }

  private async _onAdd() {
    return new Promise(async (resolve, reject) => {
      try {
        // Set up changestyle event listener (similar to MapML)
        this.el.addEventListener(
          'changestyle',
          (e: any) => {
            e.stopPropagation();
            if (e.detail) {
              this.src = e.detail.src;
            }
          },
          { once: true }
        );

        const base = this.el.baseURI ? this.el.baseURI : document.baseURI;
        
        if (this.src) {
          // Fetch remote MapML content
          const headers = new Headers();
          headers.append('Accept', 'text/mapml');
          
          const response = await fetch(this.src, { headers });
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const mapml = await response.text();
          const content = new DOMParser().parseFromString(mapml, 'text/xml');
          
          if (content.querySelector('parsererror') || !content.querySelector('mapml-')) {
            this._fetchError = true;
            console.log('Error fetching layer content:\n\n' + mapml + '\n');
            throw new Error('Parser error');
          }
          
          // Copy remote content to shadow DOM
          this._copyRemoteContentToShadowRoot(content.querySelector('mapml-'));
          
          // Wait for child elements to be ready
          const elements = this.el.shadowRoot.querySelectorAll('*');
          const elementsReady = [];
          for (let i = 0; i < elements.length; i++) {
            if ((elements[i] as any).whenReady) {
              elementsReady.push((elements[i] as any).whenReady());
            }
          }
          await Promise.allSettled(elementsReady);
          
          // Check projection and create layer
          this._selectAlternateOrChangeProjection();
          
          // Use static import - much simpler than dynamic import
          const mapLayerFn = (MapLayerModule as any).mapLayer;
          this._layer = mapLayerFn(new URL(this.src, base).href, this.el, {
            projection: this.getProjection(),
            opacity: this.opacity ?? 1.0
          });
        } else {
          // Handle inline content
          const elements = this.el.querySelectorAll('*');
          const elementsReady = [];
          for (let i = 0; i < elements.length; i++) {
            if ((elements[i] as any).whenReady) {
              elementsReady.push((elements[i] as any).whenReady());
            }
          }
          await Promise.allSettled(elementsReady);
          
          this._selectAlternateOrChangeProjection();
          
          const mapLayerFn2 = (MapLayerModule as any).mapLayer;
          this._layer = mapLayerFn2(null, this.el, {
            projection: this.getProjection(),
            opacity: this.opacity ?? 1.0
          });
        }
        
        // Create layer control HTML
        await this._createLayerControlHTML();
        this._setLocalizedDefaultLabel();
        this._attachedToMap();
        
        // Set up mutation observers (simplified for now)
        // TODO: Implement _runMutationObserver and _bindMutationObserver
        
        this._validateDisabled();
        
        // Dispatch loadedmetadata event
        this.el.dispatchEvent(
          new CustomEvent('loadedmetadata', { detail: { target: this.el } })
        );
        
        resolve(undefined);
        
      } catch (error) {
        if (error.message === 'changeprojection') {
          if (error.cause?.href) {
            console.log('Changing layer src to: ' + error.cause.href);
            this.src = error.cause.href;
          } else if (error.cause?.mapprojection) {
            console.log('Changing map projection to match layer: ' + error.cause.mapprojection);
            const mapEl = this.getMapEl();
            if (mapEl) {
              (mapEl as any).projection = error.cause.mapprojection;
            }
          }
        } else if (error.message === 'Failed to fetch') {
          this._fetchError = true;
        } else {
          console.log(error);
          this.el.dispatchEvent(
            new CustomEvent('error', { detail: { target: this.el } })
          );
        }
        reject(error);
      }
    });
  }

  private _hiddenObserver?: MutationObserver;

  private _setupHiddenAttributeObserver() {
    // Store the current hidden state
    let previousHiddenValue = this.el.hasAttribute('hidden');

    // Set up MutationObserver to watch for hidden attribute changes
    this._hiddenObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
          const currentHiddenValue = this.el.hasAttribute('hidden');
          if (currentHiddenValue !== previousHiddenValue) {
            previousHiddenValue = currentHiddenValue;
            this._hiddenChangeHandler(currentHiddenValue);
          }
        }
      });
    });

    // Start observing
    this._hiddenObserver.observe(this.el, {
      attributes: true,
      attributeFilter: ['hidden']
    });
  }

  private _disconnectHiddenObserver() {
    if (this._hiddenObserver) {
      this._hiddenObserver.disconnect();
      this._hiddenObserver = undefined;
    }
  }

  disconnectedCallback() {
    // if the map-layer node is removed from the dom, the layer should be
    // removed from the map and the layer control
    if (this.el.hasAttribute('data-moving')) return;
    this._onRemove();
  }

  private _onRemove() {
    // Disconnect any observers
    this._disconnectHiddenObserver();
    
    // Get references to layer components for cleanup
    let l = this._layer,
      lc = this._layerControl;

    // Remove event listeners from the layer
    if (l) {
      l.off();
    }
    
    // Remove the layer from the Leaflet map if it's added
    if (l && l._map) {
      l._map.removeLayer(l);
    }

    // Remove the layer from the layer control if it exists and layer is not hidden
    if (lc && !this.el.hasAttribute('hidden')) {
      // lc.removeLayer depends on this._layerControlHTML, can't delete it until after
      lc.removeLayer(l);
    }
    
    // Clean up layer references
    delete this._layer;
    delete this._layerControl;
    delete this._layerControlHTML;
  }

  render() {
    return null;
  }
}
