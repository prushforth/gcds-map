export class ZoomInput {
  name: string;
  min: string;
  max: string;
  value: number;
  step: string;
  layer: any;

  constructor(name: string, min: string, max: string, value: number, step: string, layer: any) {
    this.name = name;
    this.min = min;
    this.max = max;
    this.value = value;
    this.step = step;
    this.layer = layer;
  }

  validateInput(): boolean {
    // name is required
    if (!this.name) {
      return false;
    }
    // min and max can not be present
    // fallback would be layer's meta, -> projection min, max
    // don't need value, map-meta max value, -> fallback is max zoom of projection
    // don't need step, defaults to 1
    return true;
  }

  getValue(): number {
    return this.layer._map.options.mapEl.zoom;
  }
}
