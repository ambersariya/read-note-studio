import '@testing-library/jest-dom';
import { deserialize, serialize } from 'node:v8';

// Supply Node's clone operation for VexFlow metrics in jsdom.
window.structuredClone = <T>(value: T): T => deserialize(serialize(value));

// jsdom has no layout engine; resize-driven layout is checked in the browser.
window.ResizeObserver = class implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};
