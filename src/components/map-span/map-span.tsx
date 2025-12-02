import { Component, Element } from '@stencil/core';

@Component({
  tag: 'map-span',
  shadow: false
})
export class MapSpan {
  @Element() el: HTMLElement;

  connectedCallback() {}
  disconnectedCallback() {}

  render() {
    return null;
  }
}
