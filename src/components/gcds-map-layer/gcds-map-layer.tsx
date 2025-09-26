import { Component, Host, h, Prop, Element, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'gcds-map-layer',
  shadow: false, // No shadow DOM for this component
})
export class GcdsMapLayer {
  @Element() el: HTMLElement;

  // Mirror map-layer attributes
  @Prop() checked?: boolean = false;
  @Prop() src: string;
  @Prop() label?: string;
  @Prop() opacity?: string;

  // Events that might be emitted by map-layer
  @Event() layerchange: EventEmitter;
  @Event() layerload: EventEmitter;
  @Event() layererror: EventEmitter;

  componentDidLoad() {
    // This component primarily exists as a declarative wrapper
    // The actual map-layer element will be created by gcds-map in its shadow DOM

    // Notify parent gcds-map that this layer is ready
    this.el.dispatchEvent(new CustomEvent('gcds-layer-ready', {
      bubbles: true,
      composed: true,
      detail: {
        checked: this.checked,
        src: this.src,
        label: this.label,
        opacity: this.opacity
      }
    }));
  }

  render() {
    // This component doesn't render anything visible
    // It exists purely as a data container for gcds-map to read from
    return <Host></Host>;
  }
}
