import { Component, Element, Prop, Watch, h } from '@stencil/core';

@Component({
  tag: 'map-geometry',
  shadow: false
})
export class MapGeometry {
  @Element() el: HTMLElement;

  @Prop({ reflect: true, mutable: true }) cs?: string;

  @Watch('cs')
  csChanged(newValue: string, oldValue: string) {
    if (oldValue !== newValue) {
      // Handle side effects if needed
    }
  }

  connectedCallback() {
    // Publish cs getter/setter on element for MapML compatibility
    Object.defineProperty(this.el, 'cs', {
      get: () => this.el.getAttribute('cs'),
      set: (val: string) => {
        if (['tcrs', 'tilematrix', 'pcrs', 'gcrs', 'map', 'tile'].includes(val)) {
          this.cs = val;
        }
      },
      configurable: true,
      enumerable: true
    });
  }

  render() {
    return <slot />;
  }
}
