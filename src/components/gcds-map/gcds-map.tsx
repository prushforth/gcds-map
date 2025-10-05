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
  @Prop() width?: string;
  @Prop() height?: string;
  @Prop({ reflect: true, attribute: 'controls' }) _controls: boolean = false;
  @Prop() static?: boolean = false;
  @Prop({ reflect: true, attribute: 'controlslist' }) _controlslist?: string;
  @Prop() locale?: any;

  // Internal state properties that mirror the original
  @State() _controlsList: DOMTokenList;
  @State() _source: string;
  @State() _history: any[] = [];
  @State() _historyIndex: number = -1;
  @State() _traversalCall: number = 0;

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

  // Note: Stencil handles constructor automatically, but we can use componentWillLoad for initialization
  componentWillLoad() {
    // Mirror the original constructor logic
    this._source = this.el.outerHTML;
    // create an array to track the history of the map and the current index
    this._history = [];
    this._historyIndex = -1;
    this._traversalCall = 0;
  }
  // see comments below regarding attributeChangedCallback vs. getter/setter
  // usage.  Effectively, the user of the element must use the property, not
  // the getAttribute/setAttribute/removeAttribute DOM API, because the latter
  // calls don't result in the getter/setter being called (so you have to use
  // the getter/setter directly)

  @Watch('_controls')
  controlsChanged(_newValue: boolean) {
    // Mirror original controls setter logic
    if (this._map) {
      this._toggleControls();
    }
  }
  get controls() {
    return this.el.hasAttribute('controls');
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
  // controlsList getter/setter - mirrors original mapml-viewer.js
  get controlsList(): DOMTokenList {
    return this._controlsList;
  }
  set controlsList(value: string | null) {
    if (this._controlsList && typeof value === 'string') {
      this._controlsList.value = value;
    }
    // Update the HTML attribute to match
    if (value) {
      this.el.setAttribute('controlslist', value);
    } else {
      this.el.removeAttribute('controlslist');
    }
  }
  @Watch('width')
  widthChanged(_newValue: string) {
    // Mirror original width setter logic
    if (this._map) {
      // Update map size
    }
  }

  @Watch('height')
  heightChanged(_newValue: string) {
    // Mirror original height setter logic
    if (this._map) {
      // Update map size
    }
  }

  @Watch('lat')
  latChanged(newValue: number) {
    if (newValue && this._map) {
      // Update map center
    }
  }

  @Watch('lon')
  lonChanged(newValue: number) {
    if (newValue && this._map) {
      // Update map center
    }
  }
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
  @Watch('zoom')
  zoomChanged(newValue: number) {
    var parsedVal = parseInt(newValue.toString(), 10);
    if (!isNaN(parsedVal) && parsedVal >= 0 && parsedVal <= 25) {
      if (this._map) {
        // Update map zoom
      }
    }
  }
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

  // Mirror the connectedCallback logic in componentDidLoad
  async componentDidLoad() {
    try {
    this._source = this.el.outerHTML;
    // create an array to track the history of the map and the current index
      this._history = [];
      this._historyIndex = -1;
      this._traversalCall = 0;
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
  disconnectedCallback() {
    this._removeEvents();

    delete this._map;
    this._deleteControls();
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

  // Helper methods that mirror the original
  async _ensureControlsLoaded() {
    // Force MapML control modules to load and register their init hooks
    // This ensures attribution and other controls work properly
    try {
      console.log('Loading MapML controls...');
      await import('../../utils/mapml/control/AttributionButton.js');
      // TODO: Load other controls if needed
      console.log('MapML controls loaded successfully');
    } catch (error) {
      console.error('Failed to load MapML controls:', error);
    }
  }

  _changeWidth(_w: number | string) {
    // Handle width changes - this will be used when implementing map resize
    if (this._map) {
      this._map.invalidateSize();
    }
  }

  _changeHeight(_h: number | string) {
    // Handle height changes - this will be used when implementing map resize
    if (this._map) {
      this._map.invalidateSize();
    }
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
      
      this._addToHistory();
      this._createControls();
      this._toggleControls();
      this._setUpEvents();
    }
  }

  _toggleStatic() {
    // Handle static attribute toggle
    if (this.static) {
      // Add static behavior
    }
  }

  _addToHistory() {
    if (this._traversalCall > 0) {
      // this._traversalCall tracks how many consecutive moveends to ignore from history
      this._traversalCall--; // this is useful for ignoring moveends corresponding to back, forward and reload
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

    let scaleValue = (window as any).M.options.announceScale;

    if (scaleValue === 'metric') {
      scaleValue = { metric: true, imperial: false };
    }
    if (scaleValue === 'imperial') {
      scaleValue = { metric: false, imperial: true };
    }

    if (!this._scaleBar) this._scaleBar = scaleBar(scaleValue).addTo(this._map);

    // Only add controls if there is enough top left vertical space
    if (!this._zoomControl && totalSize + 93 <= mapSize) {
      totalSize += 93;
      this._zoomControl = control
        .zoom({
          zoomInTitle: this.locale.btnZoomIn,
          zoomOutTitle: this.locale.btnZoomOut
        })
        .addTo(this._map);
    }
    if (!this._reloadButton && totalSize + 49 <= mapSize) {
      totalSize += 49;
      this._reloadButton = reloadButton().addTo(this._map);
    }
    if (!this._fullScreenControl && totalSize + 49 <= mapSize) {
      totalSize += 49;
      this._fullScreenControl = fullscreenButton().addTo(this._map);
    }

    if (!this._geolocationButton) {
      this._geolocationButton = geolocationButton().addTo(this._map);
    }
  }

  // Sets controls by hiding/unhiding them based on the map attribute
  _toggleControls() {
    if (this.controls === false) {
      this._hideControls();
      this._map.contextMenu.toggleContextMenuItem('Controls', 'disabled');
    } else {
      this._showControls();
      this._map.contextMenu.toggleContextMenuItem('Controls', 'enabled');
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

  _removeEvents() {
    // TODO: Implement event cleanup
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
