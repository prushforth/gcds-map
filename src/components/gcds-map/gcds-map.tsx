import { Component, Prop, Element, State, Watch, h } from '@stencil/core';
import {
  map,
  LatLng,
  control
} from 'leaflet';
// import Proj from 'proj4leaflet/src/proj4leaflet.js';
import { Util } from '../../utils/mapml/Util.js';
import { DOMTokenList } from '../../utils/mapml/DOMTokenList';
// import { locale } from '../../utils/mapml/generated-locale.js';
// import { matchMedia } from '../../utils/mapml/elementSupport/viewers/matchMedia.js';
// TODO: Import Stencil component versions when created
// import { HTMLLayerElement } from '../map-layer/map-layer.js';
// import { LayerDashElement } from '../layer-/layer-.js';
// import { HTMLMapCaptionElement } from '../map-caption/map-caption.js';
// import { HTMLFeatureElement } from '../map-feature/map-feature.js';
// import { HTMLExtentElement } from '../map-extent/map-extent.js';
// import { HTMLInputElement } from '../map-input/map-input.js';
// import { HTMLSelectElement } from '../map-select/map-select.js';
// import { HTMLLinkElement } from '../map-link/map-link.js';
// import { HTMLStyleElement } from '../map-style/map-style.js';
// import { HTMLWebMapElement } from '../web-map/web-map.js';
// import { HTMLMapAreaElement } from '../map-area/map-area.js';

// TODO: Uncomment when implementing controls
// import { layerControl } from '../../utils/mapml/control/LayerControl.js';
// due to Stencil bundling shenanigans, the import here doesn't happen 
// (maybe because it's not actually called anywhere - the attribution control
// was auto-added and the
// attribution control doesn't get auto-added 
  // Auto-added via Map.addInitHook
// import { attributionButton } from '../../utils/mapml/control/AttributionButton.js';
import { reloadButton } from '../../utils/mapml/control/ReloadButton.js';
import { scaleBar } from '../../utils/mapml/control/ScaleBar.js';
import { fullscreenButton } from '../../utils/mapml/control/FullscreenButton.js';
import { geolocationButton } from '../../utils/mapml/control/GeolocationButton.js';
// import { debugOverlay } from '../../utils/mapml/layers/DebugOverlay.js';
// import { crosshair } from '../../utils/mapml/layers/Crosshair.js';
// import { featureIndexOverlay } from '../../utils/mapml/layers/FeatureIndexOverlay.js';

@Component({
  tag: 'gcds-map',
  styleUrl: 'gcds-map.css',
  shadow: true,
})
export class GcdsMap {
  @Element() el: HTMLElement;

  // Mirror the observedAttributes as Stencil props
  @Prop({ mutable: true }) lat?: number = 0;
  @Prop({ mutable: true }) lon?: number = 0;
  @Prop({ mutable: true }) zoom?: number = 0;
  @Prop() projection?: string = 'OSMTILE';
  @Prop({ reflect: true }) width?: string;
  @Prop({ reflect: true }) height?: string;
  @Prop({ reflect: true, attribute: 'controls' }) controls: boolean = false;
  @Prop({ reflect: true }) static?: boolean = false;
  @Prop({ reflect: true, attribute: 'controlslist' }) _controlslist?: string;
  @Prop() locale?: any;

  // Internal state properties that mirror the original
  @State() _controlsList: DOMTokenList;
  @State() _source: string;
  @State() _history: any[] = [];
  @State() _historyIndex: number = -1;
  @State() _traversalCall: number | false = false;

  // Private properties that mirror the original (will be set in componentDidLoad)
  private _map: any;
  // private locale: any; // TODO: Use when implementing locale support
  private _container: HTMLElement;
  private mapCaptionObserver: MutationObserver;
  // private _crosshair: any; // TODO: Use when implementing crosshair
  // private _featureIndexOverlay: any; // TODO: Use when implementing feature index

  private _zoomControl: any;
  private _layerControl: any;
  private _reloadButton: any;
  private _fullScreenControl: any;
  private _geolocationButton: any;
  private _scaleBar: any;


  // see comments below regarding attributeChangedCallback vs. getter/setter
  // usage.  Effectively, the user of the element must use the property, not
  // the getAttribute/setAttribute/removeAttribute DOM API, because the latter
  // calls don't result in the getter/setter being called (so you have to use
  // the getter/setter directly)
  @Watch('controls')
  controlsChanged(newValue: boolean) {
    // Mirror original controls setter logic
    if (this._map) {
      if (newValue) {
        this._showControls();
      } else {
        this._hideControls();
      }
    }
  }
  @Watch('_controlslist')
  controlsListChanged(newValue: string) {
    if (this._controlsList) {
      this._controlsList.value = newValue;
      // Re-toggle controls to apply the new controlslist filtering
      if (this._map) {
        this._toggleControls();
      }
    }
  }

  get controlsList(): DOMTokenList {
    return this._controlsList;
  }
  set controlsList(value: string | null) {
    if (this._controlsList && (typeof value === 'string' || value === null)) {
      if (value) {
        this.el.setAttribute('controlslist', value);
      } else {
        this.el.removeAttribute('controlslist');
      }
      // DOMTokenList automatically reflects the attribute change
      // Re-toggle controls based on new attribute value
      if (this._map) {
        this._toggleControls();
      }
    }
  }
  @Watch('width')
  widthChanged(newValue: string) {
    if (newValue && this._map) {
      this._changeWidth(newValue);
    }
  }
  @Watch('height')
  heightChanged(newValue: string) {
    if (newValue && this._map) {
      this._changeHeight(newValue);
    }
  }

  // Note: lat, lon, and zoom are NOT watched because in mapml-viewer, changing these
  // attributes does not change the map position/zoom. These attributes are only 
  // updated by map events to reflect the current state for external observers.
  @Watch('projection')
  async projectionChanged(newValue: string) {
    if (newValue) {
      try {
        await this.whenProjectionDefined(newValue);
        // Projection changed successfully
      } catch {
        throw new Error('Undefined projection: ' + newValue);
      }
    }
  }
  
  // Note: zoom is NOT watched because in mapml-viewer, changing the zoom attribute
  // does not change the map zoom. The zoom attribute is only updated by map events
  // to reflect the current state for external observers.
  
  get layers() {
    return this.el.getElementsByTagName('map-layer');
  }
  get extent() {
    let map = this._map,
      pcrsBounds = Util.pixelToPCRSBounds(
        map.getPixelBounds(),
        map.getZoom(),
        map.options.projection
      );
    let formattedExtent = Util._convertAndFormatPCRS(
      pcrsBounds,
      map.options.crs,
      this.projection
    );
    // get min/max zoom from layers at this moment
    let minZoom = Infinity,
      maxZoom = -Infinity;
    for (let i = 0; i < this.layers.length; i++) {
      if ((this.layers[i] as any).extent) {
        if ((this.layers[i] as any).extent.zoom.minZoom < minZoom)
          minZoom = (this.layers[i] as any).extent.zoom.minZoom;
        if ((this.layers[i] as any).extent.zoom.maxZoom > maxZoom)
          maxZoom = (this.layers[i] as any).extent.zoom.maxZoom;
      }
    }

    formattedExtent.zoom = {
      minZoom: minZoom !== Infinity ? minZoom : map.getMinZoom(),
      maxZoom: maxZoom !== -Infinity ? maxZoom : map.getMaxZoom()
    };
    return formattedExtent;
  }
  @Watch('static')
  staticChanged() {
    if (this._map) {
      this._toggleStatic();
    }
  }
  // Note: Stencil handles constructor automatically, but we can use componentWillLoad for initialization
  componentWillLoad() {
    // Mirror the original constructor logic
    this._source = this.el.outerHTML;
    // create an array to track the history of the map and the current index
    this._history = [];
    this._historyIndex = -1;
    this._traversalCall = false;
  }
  // Mirror the connectedCallback logic in componentDidLoad
  async componentDidLoad() {
    try {
    this._source = this.el.outerHTML;
    // create an array to track the history of the map and the current index
      this._history = [];
      this._historyIndex = -1;
      this._traversalCall = false;
      
      // Sync initial history state to element for MapML controls
      (this.el as any)._history = this._history;
      (this.el as any)._historyIndex = this._historyIndex;
      // Ensure MapML controls are loaded and their init hooks are registered
      // BEFORE creating any maps. This is critical for proper attribution control.
      await this._ensureControlsLoaded();
      
      await this.whenProjectionDefined(this.projection);
      this._setLocale();
      this._initShadowRoot();

      this._controlsList = new DOMTokenList(
        this.el.getAttribute('controlslist'),
        this.el,
        'controlslist',
        [
          'noreload',
          'nofullscreen',
          'nozoom',
          'nolayer',
          'noscale',
          'geolocation'
        ]
      );

      // Force layout computation and wait for CSS to be applied
      window.getComputedStyle(this.el);
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Multiple attempts to get dimensions (defensive against CSS timing)
      let rect = this.el.getBoundingClientRect();
      let attempts = 0;
      while ((rect.width === 0 || rect.height === 0) && attempts < 3) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        rect = this.el.getBoundingClientRect();
        attempts++;
      }
      
      // Fallback to explicit dimensions if getBoundingClientRect still fails
      const w = this.width ? parseInt(this.width, 10) : (rect.width || 300);
      const h = this.height ? parseInt(this.height, 10) : (rect.height || 150);
   
      this._changeWidth(w);
      this._changeHeight(h);

      this._createMap();

      // https://github.com/Maps4HTML/MapML.js/issues/274
      this.el.setAttribute('role', 'application');
      this._toggleStatic();

      /*
    1. only deletes aria-label when the last (only remaining) map caption is removed
    2. only deletes aria-label if the aria-label was defined by the map caption element itself
    */

      let mapcaption = this.el.querySelector('map-caption');

      if (mapcaption !== null) {
        setTimeout(() => {
          let ariaupdate = this.el.getAttribute('aria-label');

          if (ariaupdate === mapcaption.innerHTML) {
            this.mapCaptionObserver = new MutationObserver((_m) => {
              let mapcaptionupdate = this.el.querySelector('map-caption');
              if (mapcaptionupdate !== mapcaption) {
                this.el.removeAttribute('aria-label');
              }
            });
            this.mapCaptionObserver.observe(this.el, {
              childList: true
            });
          }
        }, 0);
      }
    } catch (e) {
      console.log(e);
      throw new Error('Error: ' + e);
    }
  }
  _setLocale() {
    if (this.el.closest(':lang(fr)') === this.el) {
      this.locale = (window as any).M.options.localeFr;
    } else if (this.el.closest(':lang(en)') === this.el) {
      this.locale = (window as any).M.options.localeEn;
    } else {
      // "browser" locale
      this.locale = (window as any).M.options.locale;
    }
  }
  _initShadowRoot() {
    // In Stencil, shadow DOM structure is handled by render()
    // This method now only handles the light DOM hiding CSS
    
    // Hide all (light DOM) children of the map element (equivalent to hideElementsCSS)
    let hideElementsCSS = document.createElement('style');
    hideElementsCSS.innerHTML = `gcds-map > * { display: none!important; }`;
    this.el.appendChild(hideElementsCSS);
    
    // Note: _container is now set via ref in render(), shadow DOM creation is automatic
  }
  _createMap() {
    console.log('_createMap() called');
    console.log('this._map:', this._map);
    console.log('this._container:', this._container);
    
    if (!this._map) {
      console.log('Creating new map...');
      this._map = map(this._container, {
        center: new LatLng(this.lat, this.lon),
        minZoom: 0,
        maxZoom: (window as any).M[this.projection].options.resolutions.length - 1,
        crs: (window as any).M[this.projection],
        zoom: this.zoom,
        zoomControl: false,
        mapEl: this.el  // Pass element reference for MapML controls
      } as any);
      
      console.log('Map created:', this._map);
      console.log('Map options:', this._map.options);
      console.log('toggleableAttributionControl:', this._map.options.toggleableAttributionControl);
      console.log('mapEl:', this._map.options.mapEl);
      
      // Make map accessible for debugging
      (this.el as any)._map = this._map;
      (window as any).__debugMap = this._map;
      
      // Expose component history properties on element for MapML control compatibility
      (this.el as any)._history = this._history;
      (this.el as any)._historyIndex = this._historyIndex;
      
      // Expose controlsList API on element for MapML control compatibility
      // Follow standard HTML DOMTokenList behavior (like video.controlsList)
      Object.defineProperty(this.el, 'controlsList', {
        get: () => this._controlsList,
        set: (value: string | null) => {
          // Standard behavior: property assignment updates DOMTokenList value
          // but does NOT update HTML attribute (unlike component setter)
          if (this._controlsList && (typeof value === 'string' || value === null)) {
            this._controlsList.value = value || '';
            // Trigger control visibility updates without changing HTML attribute
            if (this._map) {
              this._toggleControls();
            }
          }
        },
        configurable: true,
        enumerable: true
      });
      
      this._addToHistory();
      this._createControls();
      this._toggleControls();
      this._setUpEvents();
    }
  }
  disconnectedCallback() {
    this._removeEvents();

    delete this._map;
    this._deleteControls();
  }
  // Helper methods that mirror the original
  async _ensureControlsLoaded() {
    // Force MapML control modules to load and register their init hooks
    // This ensures attribution and other controls work properly
    try {
      console.log('Loading MapML controls...');
    // await import('leaflet');
    // const locateModule = await import('leaflet.locatecontrol');
    // console.log('LocateControl loaded:', locateModule);
    
    // // Now load GeolocationButton which depends on LocateControl
    // const geolocationModule = await import('../../utils/mapml/control/GeolocationButton.js');
    // console.log('GeolocationButton loaded:', geolocationModule);

    await import('../../utils/mapml/control/AttributionButton.js');
      // TODO: Load other controls if needed
      console.log('MapML controls loaded successfully');
    } catch (error) {
      console.error('Failed to load MapML controls:', error);
    }
  }
  // Creates All map controls and adds them to the map, when created.
  _createControls() {
    let mapSize = this._map.getSize().y,
      totalSize = 0;

    // this._layerControl = layerControl(null, {
    //   collapsed: true,
    //   mapEl: this
    // }).addTo(this._map);
    // this._map.on('movestart', this._layerControl.collapse, this._layerControl);
    // // Expose on element for MapML compatibility
    // (this.el as any)._layerControl = this._layerControl;

    let scaleValue = (window as any).M.options.announceScale;

    if (scaleValue === 'metric') {
      scaleValue = { metric: true, imperial: false };
    }
    if (scaleValue === 'imperial') {
      scaleValue = { metric: false, imperial: true };
    }

    if (!this._scaleBar) {
      this._scaleBar = scaleBar(scaleValue).addTo(this._map);
      // Expose on element for MapML compatibility
      (this.el as any)._scaleBar = this._scaleBar;
    }

    // Only add controls if there is enough top left vertical space
    if (!this._zoomControl && totalSize + 93 <= mapSize) {
      totalSize += 93;
      this._zoomControl = control
        .zoom({
          zoomInTitle: this.locale.btnZoomIn,
          zoomOutTitle: this.locale.btnZoomOut
        })
        .addTo(this._map);
      // Expose on element for MapML compatibility
      (this.el as any)._zoomControl = this._zoomControl;
    }
    if (!this._reloadButton && totalSize + 49 <= mapSize) {
      totalSize += 49;
      this._reloadButton = reloadButton().addTo(this._map);
      // Expose on element for MapML compatibility
      (this.el as any)._reloadButton = this._reloadButton;
    }
    if (!this._fullScreenControl && totalSize + 49 <= mapSize) {
      totalSize += 49;
      this._fullScreenControl = fullscreenButton().addTo(this._map);
      // Expose on element for MapML compatibility
      (this.el as any)._fullScreenControl = this._fullScreenControl;
    }

    if (!this._geolocationButton) {
      this._geolocationButton = geolocationButton().addTo(this._map);
      // Expose on element for MapML compatibility
      (this.el as any)._geolocationButton = this._geolocationButton;
    }
  }
  // Sets controls by hiding/unhiding them based on the map attribute
  _toggleControls() {
    if (this.controls === false) {
      this._hideControls();
      // TODO: Add context menu support later
      // this._map.contextMenu.toggleContextMenuItem('Controls', 'disabled');
    } else {
      this._showControls();
      // TODO: Add context menu support later
      // this._map.contextMenu.toggleContextMenuItem('Controls', 'enabled');
    }
  }

  _hideControls() {
    this._setControlsVisibility('fullscreen', true);
    this._setControlsVisibility('layercontrol', true);
    this._setControlsVisibility('reload', true);
    this._setControlsVisibility('zoom', true);
    this._setControlsVisibility('geolocation', true);
    this._setControlsVisibility('scale', true);
  }
  _showControls() {
    this._setControlsVisibility('fullscreen', false);
    this._setControlsVisibility('layercontrol', false);
    this._setControlsVisibility('reload', false);
    this._setControlsVisibility('zoom', false);
    this._setControlsVisibility('geolocation', true);
    this._setControlsVisibility('scale', false);

    // prune the controls shown if necessary
    // this logic could be embedded in _showControls
    // but would require being able to iterate the domain of supported tokens
    // for the controlslist
    if (this._controlsList) {
      this._controlsList.forEach((value) => {
        switch (value.toLowerCase()) {
          case 'nofullscreen':
            this._setControlsVisibility('fullscreen', true);
            break;
          case 'nolayer':
            this._setControlsVisibility('layercontrol', true);
            break;
          case 'noreload':
            this._setControlsVisibility('reload', true);
            break;
          case 'nozoom':
            this._setControlsVisibility('zoom', true);
            break;
          case 'geolocation':
            this._setControlsVisibility('geolocation', false);
            break;
          case 'noscale':
            this._setControlsVisibility('scale', true);
            break;
        }
      });
    }
    // Hide layer control if no layers (will be uncommented when layer control is implemented)
    // if (this._layerControl && this._layerControl._layers.length === 0) {
    //   this._layerControl._container.setAttribute('hidden', '');
    // }
  }
  // delete the map controls that are private properties of this custom element
  _deleteControls() {
    delete this._layerControl;
    delete this._zoomControl;
    delete this._reloadButton;
    delete this._fullScreenControl;
    delete this._geolocationButton;
    delete this._scaleBar;
  }
    // Sets the control's visibility AND all its childrens visibility,
  // for the control element based on the Boolean hide parameter
  _setControlsVisibility(control, hide) {
    let container;
    switch (control) {
      case 'zoom':
        if (this._zoomControl) {
          container = this._zoomControl._container;
        }
        break;
      case 'reload':
        if (this._reloadButton) {
          container = this._reloadButton._container;
        }
        break;
      case 'fullscreen':
        if (this._fullScreenControl) {
          container = this._fullScreenControl._container;
        }
        break;
      case 'layercontrol':
        if (this._layerControl) {
          container = this._layerControl._container;
        }
        break;
      case 'geolocation':
        if (this._geolocationButton) {
          container = this._geolocationButton._container;
        }
        break;
      case 'scale':
        if (this._scaleBar) {
          container = this._scaleBar._container;
        }
        break;
    }
    if (container) {
      if (hide) {
        // setting the visibility for all the children of the element
        [...container.children].forEach((childEl) => {
          childEl.setAttribute('hidden', '');
        });
        container.setAttribute('hidden', '');
      } else {
        // setting the visibility for all the children of the element
        [...container.children].forEach((childEl) => {
          childEl.removeAttribute('hidden');
        });
        container.removeAttribute('hidden');
      }
    }
  }  
  _toggleStatic() {
    // Mirror the original mapml-viewer _toggleStatic behavior
    if (this._map) {
      if (this.static) {
        this._map.dragging.disable();
        this._map.touchZoom.disable();
        this._map.doubleClickZoom.disable();
        this._map.scrollWheelZoom.disable();
        this._map.boxZoom.disable();
        this._map.keyboard.disable();
        this._zoomControl.disable();
      } else {
        this._map.dragging.enable();
        this._map.touchZoom.enable();
        this._map.doubleClickZoom.enable();
        this._map.scrollWheelZoom.enable();
        this._map.boxZoom.enable();
        this._map.keyboard.enable();
        this._zoomControl.enable();
      }
    }
  }
  _removeEvents() {
    // TODO: Implement event cleanup
  }
  _setUpEvents() {
    // Set up map event handlers to sync with component props
    this._map.on(
      'moveend',
      function () {
        this._updateMapCenter();
        this._addToHistory();
        this.el.dispatchEvent(
          new CustomEvent('moveend', { detail: { target: this } })
        );
      },
      this
    );
    this._map.on(
      'zoom',
      function () {
        this.el.dispatchEvent(
          new CustomEvent('zoom', { detail: { target: this } })
        );
      },
      this
    );
    this._map.on(
      'zoomend',
      function () {
        this._updateMapCenter();
        this.el.dispatchEvent(
          new CustomEvent('zoomend', { detail: { target: this } })
        );
      },
      this
    );
  }
  _changeWidth(width: number | string) {
    const widthPx = typeof width === 'string' ? width : width + 'px';
    
    // Update host element style
    this.el.style.width = widthPx;
    
    // Update container if it exists
    if (this._container) {
      this._container.style.width = widthPx;
    }
    
    // Invalidate map size if map exists
    if (this._map) {
      this._map.invalidateSize();
    }
  }

  _changeHeight(height: number | string) {
    const heightPx = typeof height === 'string' ? height : height + 'px';
    
    // Update host element style
    this.el.style.height = heightPx;
    
    // Update container if it exists
    if (this._container) {
      this._container.style.height = heightPx;
    }
    
    // Invalidate map size if map exists
    if (this._map) {
      this._map.invalidateSize();
    }
  }
  _updateMapCenter() {
    // Update component props to match map state and sync to DOM attributes
    // Note: Stencil mutable props don't automatically reflect changes back to DOM attributes
    if (this._map) {
      const center = this._map.getCenter();
      this.lat = center.lat;
      this.lon = center.lng;
      this.zoom = this._map.getZoom();
      
      // Manually sync the props back to DOM attributes
      this.el.setAttribute('lat', this.lat.toString());
      this.el.setAttribute('lon', this.lon.toString());
      this.el.setAttribute('zoom', this.zoom.toString());
    }
  }
  _resetHistory() {
    this._history = [];
    this._historyIndex = -1;
    this._traversalCall = false;
    // weird but ok (original comment)
    this._addToHistory();
  }
  _addToHistory() {
    if (typeof this._traversalCall === 'number' && this._traversalCall > 0) {
      // this._traversalCall tracks how many consecutive moveends to ignore from history
      this._traversalCall--; // this is useful for ignoring moveends corresponding to back, forward and reload
      // Reset to false when it reaches 0 (mimics original behavior)
      if (this._traversalCall === 0) {
        this._traversalCall = false;
      }
      return;
    }

    let mapLocation = this._map.getPixelBounds().getCenter();
    let location = {
      zoom: this._map.getZoom(),
      x: mapLocation.x,
      y: mapLocation.y
    };
    this._historyIndex++;
    this._history.splice(this._historyIndex, 0, location);
    // Remove future history and overwrite it when map pan/zoom while inside history
    if (this._historyIndex + 1 !== this._history.length) {
      this._history.length = this._historyIndex + 1;
    }
    if (this._historyIndex === 0) {
      // when at initial state of map, disable back, forward, and reload items
      this._map.contextMenu.toggleContextMenuItem('Back', 'disabled'); // back contextmenu item
      this._map.contextMenu.toggleContextMenuItem('Forward', 'disabled'); // forward contextmenu item
      this._map.contextMenu.toggleContextMenuItem('Reload', 'disabled'); // reload contextmenu item
      this._reloadButton?.disable();
    } else {
      this._map.contextMenu.toggleContextMenuItem('Back', 'enabled'); // back contextmenu item
      this._map.contextMenu.toggleContextMenuItem('Forward', 'disabled'); // forward contextmenu item
      this._map.contextMenu.toggleContextMenuItem('Reload', 'enabled'); // reload contextmenu item
      this._reloadButton?.enable();
    }
    
    // Sync updated history properties to element for MapML controls
    (this.el as any)._history = this._history;
    (this.el as any)._historyIndex = this._historyIndex;
  }
  /**
   * Allow user to move back in history
   */
  back() {
    let history = this._history;
    let curr = history[this._historyIndex];

    if (this._historyIndex > 0) {
      this._map.contextMenu.toggleContextMenuItem('Forward', 'enabled');
      this._historyIndex--;
      let prev = history[this._historyIndex];
      
      // Disable back, reload contextmenu item when at the end of history
      if (this._historyIndex === 0) {
        this._map.contextMenu.toggleContextMenuItem('Back', 'disabled');
        this._map.contextMenu.toggleContextMenuItem('Reload', 'disabled');
        this._reloadButton?.disable();
      }

      if (prev.zoom !== curr.zoom) {
        this._traversalCall = 2;
        let currScale = this._map.options.crs.scale(curr.zoom);
        let prevScale = this._map.options.crs.scale(prev.zoom);
        let scale = currScale / prevScale;
        this._map.panBy([
          prev.x * scale - curr.x,
          prev.y * scale - curr.y
        ], { animate: false });
        this._map.setZoom(prev.zoom);
      } else {
        this._traversalCall = 1;
        this._map.panBy([prev.x - curr.x, prev.y - curr.y]);
      }
      
      // Sync updated history properties to element
      (this.el as any)._history = this._history;
      (this.el as any)._historyIndex = this._historyIndex;
    }
  }

  /**
   * Allows user to move forward in history
   */
  forward() {
    let history = this._history;
    let curr = history[this._historyIndex];
    
    if (this._historyIndex < history.length - 1) {
      this._map.contextMenu.toggleContextMenuItem('Back', 'enabled');
      this._historyIndex++;
      let next = history[this._historyIndex];
      
      // Disable forward contextmenu item when at the end of history
      if (this._historyIndex === history.length - 1) {
        this._map.contextMenu.toggleContextMenuItem('Forward', 'disabled');
      }

      if (next.zoom !== curr.zoom) {
        this._traversalCall = 2;
        let currScale = this._map.options.crs.scale(curr.zoom);
        let nextScale = this._map.options.crs.scale(next.zoom);
        let scale = currScale / nextScale;
        this._map.panBy([
          next.x * scale - curr.x,
          next.y * scale - curr.y
        ], { animate: false });
        this._map.setZoom(next.zoom);
      } else {
        this._traversalCall = 1;
        this._map.panBy([next.x - curr.x, next.y - curr.y]);
      }
      
      // Sync updated history properties to element
      (this.el as any)._history = this._history;
      (this.el as any)._historyIndex = this._historyIndex;
    }
  }

  /**
   * Allows the user to reload/reset the map's location to it's initial location
   */
  reload() {
    let initialLocation = this._history.shift();
    let mapLocation = this._map.getPixelBounds().getCenter();
    let curr = {
      zoom: this._map.getZoom(),
      x: mapLocation.x,
      y: mapLocation.y
    };

    this._map.contextMenu.toggleContextMenuItem('Back', 'disabled'); // back contextmenu item
    this._map.contextMenu.toggleContextMenuItem('Forward', 'disabled'); // forward contextmenu item
    this._map.contextMenu.toggleContextMenuItem('Reload', 'disabled'); // reload contextmenu item
    this._reloadButton?.disable();

    this._history = [initialLocation];
    this._historyIndex = 0;
    
    // Sync updated history properties to element for MapML controls
    (this.el as any)._history = this._history;
    (this.el as any)._historyIndex = this._historyIndex;

    if (initialLocation.zoom !== curr.zoom) {
      this._traversalCall = 2; // ignores the next 2 moveend events

      let currScale = this._map.options.crs.scale(curr.zoom); // gets the scale of the current zoom level
      let initScale = this._map.options.crs.scale(initialLocation.zoom); // gets the scale of the initial location's zoom

      let scale = currScale / initScale;

      this._map.panBy(
        [
          initialLocation.x * scale - curr.x,
          initialLocation.y * scale - curr.y
        ],
        { animate: false }
      );
      this._map.setZoom(initialLocation.zoom);
    } else {
      // if it's on the same zoom level as the initial location, no need to calculate scales
      this._traversalCall = 1;
      this._map.panBy([initialLocation.x - curr.x, initialLocation.y - curr.y]);
    }
    this._map.getContainer().focus();
  }
  _toggleFullScreen() {
    this._map.toggleFullscreen();
  }


  async whenProjectionDefined(projection: string) {
    // Mirror the original whenProjectionDefined logic
    return new Promise((resolve, reject) => {
      if ((window as any).M[projection]) {
        resolve((window as any).M[projection]);
      } else {
        reject(new Error('Projection ' + projection + ' is not defined'));
      }
    });
  }

  render() {
    // Mirror the original shadow DOM structure from _initShadowRoot
    return [
      // CSS will be handled by styleUrl in @Component
      <output 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        class="mapml-screen-reader-output"
      ></output>,
      <div 
        ref={(el) => this._container = el as HTMLElement}
        role="region" 
        aria-label="Interactive map"
        class="mapml-map-container"
      ></div>
    ];
  }
}
