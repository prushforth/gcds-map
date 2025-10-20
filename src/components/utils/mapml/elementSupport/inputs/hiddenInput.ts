export class HiddenInput {
  name: string;
  value: string;

  constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }

  validateInput(): boolean {
    // name is required
    // value is required
    if (!this.name || !this.value) {
      return false;
    }
    return true;
  }

  getValue(): string {
    return this.value;
  }
}
