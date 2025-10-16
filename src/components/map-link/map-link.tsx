import { Component, Element, Prop, Method, h } from '@stencil/core';

declare const M: any;

@Component({
  tag: 'map-link',
  shadow: true
})
export class GcdsMapLink {
  @Element() el: HTMLElement;
  
  @Prop({ reflect: true }) type?: string = 'image/*';
  @Prop({ reflect: true }) rel?: string;
  @Prop({ reflect: true }) href?: string;
  @Prop({ reflect: true }) hreflang?: string;
  @Prop({ reflect: true }) tref?: string;
  @Prop({ reflect: true }) media?: string;
  @Prop({ reflect: true }) tms?: boolean;
  @Prop({ reflect: true }) projection?: string;
  @Prop({ reflect: true }) disabled?: boolean;

  // Properties that map-extent expects to exist
  _templatedLayer: any;
  _templateVars: any;
  parentExtent: any;
  link: any;

  @Method()
  async whenReady(): Promise<void> {
    return Promise.resolve();
  }

  @Method()
  async zoomTo() {
    console.log('map-link zoomTo() - stub implementation');
  }

  @Method()
  async getBounds() {
    // Return a stub bounds object that map-extent can use
    return {
      min: { x: 0, y: 0 },
      max: { x: 100, y: 100 }
    };
  }

  @Method()
  async getZoomBounds() {
    // Return stub zoom bounds that map-extent can use
    return {
      minZoom: 0,
      maxZoom: 18,
      minNativeZoom: 0,
      maxNativeZoom: 18
    };
  }

  isVisible(): boolean {
    return !this.disabled && !this.el.hasAttribute('hidden');
  }

  connectedCallback() {
    // Find parent extent for MapML compatibility
    this.parentExtent = this.el.closest('map-extent');
    
    // Create a minimal link object for compatibility
    this.link = {
      isConnected: true
    };
  }

  disconnectedCallback() {
    // Cleanup
    this.link = null;
  }

  render() {
    return <slot></slot>;
  }
}