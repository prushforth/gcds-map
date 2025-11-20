import { Component, Element, Prop } from '@stencil/core';

@Component({
  tag: 'map-a',
  shadow: false
})
export class MapA {
  @Element() el: HTMLElement;

  @Prop({ reflect: true }) href?: string;
  @Prop({ reflect: true }) target?: string;
  @Prop({ reflect: true }) type?: string;
  @Prop({ reflect: true }) inplace?: boolean;

  render() {
    return null;
  }
}
