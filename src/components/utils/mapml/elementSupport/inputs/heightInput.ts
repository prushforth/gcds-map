export class HeightInput {
  name: string;
  layer: any;

  constructor(name: string, layer: any) {
    this.name = name;
    this.layer = layer;
  }

  validateInput(): boolean {
    // name is required
    if (!this.name) {
      return false;
    }
    return true;
  }

  getValue(): number {
    return this.layer._map.getSize().y;
  }
}
