import { Component, Prop, Element, Watch, Method } from '@stencil/core';

@Component({
  tag: 'map-select',
  shadow: false
})
export class MapSelect {
  @Element() el: HTMLElement;

  @Prop({ reflect: true }) name?: string;

  selectDetails?: HTMLElement;
  htmlSelect?: HTMLSelectElement;

  connectedCallback() {
    this._createLayerControlForSelect();
    (this.el as any).selectDetails = this.selectDetails;
    (this.el as any).htmlSelect = this.htmlSelect;
  }

  disconnectedCallback() {}

  @Watch('name')
  nameChanged(newValue: string, oldValue: string) {
    if (oldValue !== newValue) {
      // handle side effects if needed
    }
  }

  private _createLayerControlForSelect() {
    this.htmlSelect = this.transcribe();
    const selectdetails = document.createElement('details');
    selectdetails.className = 'mapml-layer-item-details mapml-control-layers';
    const selectsummary = document.createElement('summary');
    const selectSummaryLabel = document.createElement('label');
    selectSummaryLabel.innerText = this.name || '';
    if (this.el.hasAttribute('id')) selectSummaryLabel.setAttribute('for', this.el.getAttribute('id'));
    selectsummary.appendChild(selectSummaryLabel);
    selectdetails.appendChild(selectsummary);
    selectdetails.appendChild(this.htmlSelect);
    this.selectDetails = selectdetails;
    // Add change event listener to trigger redraw
    this.htmlSelect.addEventListener('change', () => {
      (this.el.parentElement as any)?._extentLayer?.redraw?.();
    });
  }

  private transcribe(): HTMLSelectElement {
    const select = document.createElement('select');
    const elementAttrNames = this.el.getAttributeNames();
    for (let i = 0; i < elementAttrNames.length; i++) {
      select.setAttribute(elementAttrNames[i], this.el.getAttribute(elementAttrNames[i])!);
    }
    const options = this.el.children;
    for (let i = 0; i < options.length; i++) {
      const option = document.createElement('option');
      const optionAttrNames = options[i].getAttributeNames();
      for (let j = 0; j < optionAttrNames.length; j++) {
        option.setAttribute(optionAttrNames[j], options[i].getAttribute(optionAttrNames[j])!);
      }
      option.innerHTML = options[i].innerHTML;
      select.appendChild(option);
    }
    return select;
  }

  @Method()
  async whenReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      let interval: any, failureTimer: any;
      if (this.selectDetails) {
        resolve();
      } else {
        const selectElement = this;
        interval = setInterval(testForSelect, 300, selectElement);
        failureTimer = setTimeout(selectNotDefined, 10000);
      }
      function testForSelect(selectElement: MapSelect) {
        if (selectElement.selectDetails) {
          clearInterval(interval);
          clearTimeout(failureTimer);
          resolve();
        } else if (!selectElement.el.isConnected) {
          clearInterval(interval);
          clearTimeout(failureTimer);
          reject('map-select was disconnected while waiting to be ready');
        }
      }
      function selectNotDefined() {
        clearInterval(interval);
        clearTimeout(failureTimer);
        reject('Timeout reached waiting for map-select to be ready');
      }
    });
  }

  render() {
    // Render the details/summary/select structure
    return null;
  }
}
