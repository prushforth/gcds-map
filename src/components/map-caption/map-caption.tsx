import { Component, Element } from '@stencil/core';

/* 
implemented for both mapml-viewer and web-map; however web-map does not focus on map element in the browser resulting in NVDA 
not being able to read out map-caption and stating that it's an interactive map region
*/
@Component({
  tag: 'map-caption',
  shadow: false
})
export class MapCaption {
  @Element() el: HTMLElement;

  observer: MutationObserver;

  connectedCallback() {
    if (
      this.el.parentElement.nodeName === 'GCDS-MAP' ||
      this.el.parentElement.nodeName === 'MAPML-VIEWER' ||
      this.el.parentElement.nodeName === 'MAP'
    ) {
      // calls MutationObserver; needed to observe changes to content between <map-caption> tags and update to aria-label
      let mapcaption =
        this.el.parentElement.querySelector('map-caption').textContent;

      this.observer = new MutationObserver(() => {
        let mapcaptionupdate =
          this.el.parentElement.querySelector('map-caption').textContent;

        if (mapcaptionupdate !== mapcaption) {
          this.el.parentElement.setAttribute(
            'aria-label',
            this.el.parentElement.querySelector('map-caption').textContent
          );
        }
      });

      this.observer.observe(this.el, {
        characterData: true,
        subtree: true,
        attributes: true,
        childList: true
      });

      // don't change aria-label if one already exists from user  (checks when element is first created)
      if (!this.el.parentElement.hasAttribute('aria-label')) {
        const ariaLabel = this.el.textContent;
        this.el.parentElement.setAttribute('aria-label', ariaLabel);
      }
    }
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  render() {
    return null;
  }
}
