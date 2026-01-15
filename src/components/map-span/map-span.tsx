import { Component, Element } from '@stencil/core';

@Component({
  tag: 'map-span',
  shadow: false
})
export class MapSpan {
  @Element() el: HTMLElement;

  connectedCallback() {}
  disconnectedCallback() {}

  // No render() method - preserve text content in light DOM
}
