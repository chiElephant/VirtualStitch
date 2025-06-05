import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';

HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,mocked';

// Polyfill for ResizeObserver to prevent errors in tests
global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

// Polyfill TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock React Three Fiber components (for canvas tests)
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid='canvas'>{children}</div>,
  useFrame: jest.fn(),
  useThree: () => ({
    camera: { position: { set: jest.fn() } },
    scene: {},
  }),
}));

// Mock React Three Drei components - SIMPLE VERSION
jest.mock('@react-three/drei', () => ({
  useGLTF: () => ({
    nodes: {},
    materials: {},
    scene: {},
  }),
  OrbitControls: () => <div data-testid='orbit-controls' />,
  Environment: () => <div data-testid='environment' />,
  ContactShadows: () => <div data-testid='contact-shadows' />,
}));

// Mock valtio for state management - ENHANCED VERSION
const mockState = {
  intro: true,
  color: '#EFBD48',
  isLogoTexture: true,
  isFullTexture: false,
  logoDecal: './threejs.png',
  fullDecal: './threejs.png',
};

jest.mock('valtio', () => ({
  proxy: jest.fn((obj) => ({ ...mockState, ...obj })),
  useSnapshot: jest.fn(() => mockState),
  snapshot: jest.fn((obj) => ({ ...mockState, ...obj })),
}));

// Mock store specifically
jest.mock('@/store', () => ({
  __esModule: true,
  default: mockState,
}));

// Mock environment variables for webhook tests
process.env.GITHUB_APP_SECRET = 'test-secret';
process.env.GITHUB_REPOSITORY = '303Devs/VirtualStitch';
process.env.GITHUB_APP_ID = '123456';
process.env.GITHUB_APP_PRIVATE_KEY =
  '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----';

// Mock FileReader for file upload tests
global.FileReader = class {
  readAsDataURL() {
    this.onload?.({
      target: {
        result: 'data:image/png;base64,test-image-data',
      },
    });
  }
};

// Mock URL methods
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Enhanced canvas context mock
const mockContext = {
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
HTMLCanvasElement.prototype.getBoundingClientRect = jest.fn(() => ({
  left: 0,
  top: 0,
  width: 100,
  height: 100,
}));

// Mock framer-motion to prevent animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => (
      <section {...props}>{children}</section>
    ),
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <div>{children}</div>,
}));
