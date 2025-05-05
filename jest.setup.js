import '@testing-library/jest-dom';
import 'whatwg-fetch';

HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,mocked';

// Polyfill for ResizeObserver to prevent errors in tests
global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
