
import { Component, Prop, Watch, Element } from '@stencil/core';

@Component({ 
  tag: 'map-meta',
  shadow: false
})
export class MapMeta {
  @Element() el: HTMLElement;

  @Prop({ reflect: true }) name?: string;
  @Prop({ reflect: true }) content?: string;

  @Watch('name')
  nameChanged(newValue: string, oldValue: string) {
    if (oldValue !== newValue) {
      // handle side effects if needed
    }
  }

  @Watch('content')
  contentChanged(newValue: string, oldValue: string) {
    if (oldValue !== newValue) {
      // handle side effects if needed
    }
  }

  // Validate 'cs' content
  set contentValue(val: string | undefined) {
    if (
      this.name === 'cs' &&
      val &&
      !['tcrs', 'tilematrix', 'pcrs', 'gcrs', 'map', 'tile'].includes(val)
    ) {
      return;
    }
    this.content = val;
  }

  connectedCallback() {}
  disconnectedCallback() {}

  render() {
    return null;
  }
}
