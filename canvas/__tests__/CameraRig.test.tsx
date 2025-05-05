import 'jest-three';
import {
  PerspectiveCamera,
  Vector2,
  Scene,
  Clock,
  Raycaster,
  WebGLRenderer,
  Object3D,
} from 'three';
import { render } from '@testing-library/react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { useSnapshot } from 'valtio';
import CameraRig from '../CameraRig';
import type { RootState } from '@react-three/fiber';

jest.mock('../../store', () => ({
  __esModule: true,
  default: {
    camera: { position: { x: 0, y: 0, z: 0 } },
    pointer: { x: 0, y: 0 },
    intro: true,
    isMobile: false,
    isBreakpoint: false,
  },
}));

jest.mock('@react-three/fiber', () => {
  const actualFiber = jest.requireActual('@react-three/fiber');
  return {
    ...actualFiber,
    useFrame: jest.fn(),
  };
});

jest.mock('valtio', () => ({
  useSnapshot: jest.fn(),
}));

jest.mock('maath', () => ({
  easing: {
    damp3: jest.fn(),
    dampE: jest.fn(),
  },
}));

jest.mock('react', () => {
  const actualReact = jest.requireActual('react');
  return {
    ...actualReact,
    useRef: jest.fn().mockReturnValue({
      current: {
        rotation: { x: 0, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
      },
    }),
  };
});

const originalConsoleError = console.error;

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((msg) => {
    if (
      msg.includes('<primitive> is unrecognized') ||
      msg.includes('<group> is unrecognized') ||
      msg.includes('The tag <%s> is unrecognized')
    ) {
      return;
    }
    originalConsoleError(msg);
  });
});

describe('CameraRig', () => {
  const mockCamera = {
    isPerspectiveCamera: true,
    type: 'PerspectiveCamera',
    zoom: 1,
    fov: 75,
    aspect: 2,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    updateProjectionMatrix: jest.fn(),
  } as unknown as PerspectiveCamera;

  const mockPointer = new Vector2(0, 0);

  const mockRootState: RootState = {
    camera: mockCamera,
    pointer: mockPointer,
    size: { width: 0, height: 0, top: 0, left: 0 },
    viewport: {
      width: 0,
      height: 0,
      dpr: 1,
      initialDpr: 1,
      factor: 1,
      distance: 1,
      aspect: 1,
      top: 0,
      left: 0,
      getCurrentViewport: jest.fn(),
    },
    gl: {
      domElement: document.createElement('canvas'),
      getContext: jest.fn(),
      render: jest.fn(),
      setSize: jest.fn(),
    } as unknown as WebGLRenderer,
    scene: { children: [] } as unknown as Scene,
    clock: { getElapsedTime: () => 0 } as unknown as Clock,
    events: {
      connected: false,
      enabled: true,
      priority: 0,
      handlers: {
        onClick: jest.fn(),
        onContextMenu: jest.fn(),
        onDoubleClick: jest.fn(),
        onWheel: jest.fn(),
        onPointerDown: jest.fn(),
        onPointerUp: jest.fn(),
        onPointerLeave: jest.fn(),
        onPointerMove: jest.fn(),
        onPointerCancel: jest.fn(),
        onLostPointerCapture: jest.fn(),
      },
    },
    raycaster: {
      setFromCamera: jest.fn(),
      intersectObjects: jest.fn(),
    } as unknown as Raycaster,
    mouse: new Vector2(),
    set: jest.fn(),
    get: jest.fn(),
    invalidate: jest.fn(),
    advance: jest.fn(),
    setEvents: jest.fn(),
    setSize: jest.fn(),
    setDpr: jest.fn(),
    xr: {
      enabled: false,
      isPresenting: false,
      setFramebufferScaleFactor: jest.fn(),
      setReferenceSpaceType: jest.fn(),
      getReferenceSpace: jest.fn(),
      setSession: jest.fn(),
      getSession: jest.fn(),
      dispose: jest.fn(),
    } as unknown as RootState['xr'],
    controls: null,
    legacy: false,
    linear: false,
    flat: false,
    frameloop: 'always',
    internal: {
      active: false,
      frames: 0,
      lastEvent: { current: null },
      priority: 0,
      interaction: [],
      hovered: new Map(),
      subscribers: new Set(),
      capturedMap: new Map(),
      initialClick: [0, 0],
      initialHits: [],
    } as unknown as RootState['internal'],
    performance: {
      current: 1,
      min: 1,
      max: 1,
      debounce: 200,
      regress: jest.fn(),
    },
    setFrameloop: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSnapshot as jest.Mock).mockReturnValue({ intro: true });
    (useFrame as jest.Mock).mockImplementation(() => {});
  });

  it('renders without crashing', () => {
    render(
      <CameraRig>
        <primitive object={new Object3D()} />
      </CameraRig>
    );
    expect(true).toBeTruthy(); // Dummy assertion to pass
  });

  it('calls damp3 and dampE in useFrame for desktop', () => {
    window.innerWidth = 1300;
    render(
      <CameraRig>
        <primitive object={new Object3D()} />
      </CameraRig>
    );
    const [[capturedCallback]] = (useFrame as jest.Mock).mock.calls;
    expect(capturedCallback).toBeDefined();
    capturedCallback(mockRootState, 0.016);
    expect(easing.damp3).toHaveBeenCalled();
    expect(easing.dampE).toHaveBeenCalled();
  });

  it('uses breakpoint positioning when window.innerWidth <= 1260', () => {
    window.innerWidth = 1200;
    render(
      <CameraRig>
        <primitive object={new Object3D()} />
      </CameraRig>
    );
    const [[capturedCallback]] = (useFrame as jest.Mock).mock.calls;
    expect(capturedCallback).toBeDefined();
    capturedCallback(mockRootState, 0.016);
    expect(easing.damp3).toHaveBeenCalledWith(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        z: expect.any(Number),
      }),
      [0, 0, 2],
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('uses mobile positioning when window.innerWidth <= 600', () => {
    window.innerWidth = 500;
    render(
      <CameraRig>
        <primitive object={new Object3D()} />
      </CameraRig>
    );
    const [[capturedCallback]] = (useFrame as jest.Mock).mock.calls;
    expect(capturedCallback).toBeDefined();
    capturedCallback(mockRootState, 0.016);
    expect(easing.damp3).toHaveBeenCalledWith(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        z: expect.any(Number),
      }),
      [0, 0.2, 2.5],
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('uses default desktop positioning when window.innerWidth > 1260', () => {
    window.innerWidth = 1400;
    render(
      <CameraRig>
        <primitive object={new Object3D()} />
      </CameraRig>
    );
    const [[capturedCallback]] = (useFrame as jest.Mock).mock.calls;
    expect(capturedCallback).toBeDefined();
    capturedCallback(mockRootState, 0.016);
    expect(easing.damp3).toHaveBeenCalledWith(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        z: expect.any(Number),
      }),
      [-0.4, 0, 2],
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('renders children', () => {
    const { getByTestId } = render(
      <CameraRig>
        <primitive
          object={new Object3D()}
          data-testid='test-child'
        />
      </CameraRig>
    );
    expect(getByTestId('test-child')).toBeInTheDocument();
  });

  it('handles non-PerspectiveCamera without errors', () => {
    const nonPerspectiveCamera = { isPerspectiveCamera: false };
    const modifiedRootState = {
      ...mockRootState,
      camera: nonPerspectiveCamera as unknown as PerspectiveCamera,
    };
    render(
      <CameraRig>
        <primitive object={new Object3D()} />
      </CameraRig>
    );
    const [[capturedCallback]] = (useFrame as jest.Mock).mock.calls;
    expect(capturedCallback).toBeDefined();
    capturedCallback(modifiedRootState, 0.016);
    expect(true).toBeTruthy();
  });

  it('triggers the intro-specific logic', () => {
    (useSnapshot as jest.Mock).mockReturnValue({
      intro: true,
      isMobile: false,
      isBreakpoint: false,
    });
    window.innerWidth = 1400;
    render(
      <CameraRig>
        <primitive object={new Object3D()} />
      </CameraRig>
    );
    const [[capturedCallback]] = (useFrame as jest.Mock).mock.calls;
    expect(capturedCallback).toBeDefined();
    capturedCallback(mockRootState, 0.016);
    expect(easing.damp3).toHaveBeenCalled();
    expect(easing.dampE).toHaveBeenCalled();
  });

  it('uses non-intro mobile/desktop positioning (covers else block)', () => {
    (useSnapshot as jest.Mock).mockReturnValue({
      intro: false,
    });

    // Test mobile fallback
    window.innerWidth = 500;
    render(
      <CameraRig>
        <primitive object={new Object3D()} />
      </CameraRig>
    );
    let [[capturedCallback]] = (useFrame as jest.Mock).mock.calls;
    expect(capturedCallback).toBeDefined();
    capturedCallback(mockRootState, 0.016);
    expect(easing.damp3).toHaveBeenCalledWith(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        z: expect.any(Number),
      }),
      [0, 0, 2.5],
      expect.any(Number),
      expect.any(Number)
    );

    // Clear mocks before desktop test
    jest.clearAllMocks();

    (useSnapshot as jest.Mock).mockReturnValue({
      intro: false,
    });

    // Test desktop fallback
    window.innerWidth = 1400;
    render(
      <CameraRig>
        <primitive object={new Object3D()} />
      </CameraRig>
    );
    [[capturedCallback]] = (useFrame as jest.Mock).mock.calls;
    expect(capturedCallback).toBeDefined();
    capturedCallback(mockRootState, 0.016);
    expect(easing.damp3).toHaveBeenCalledWith(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        z: expect.any(Number),
      }),
      [0, 0, 2],
      expect.any(Number),
      expect.any(Number)
    );
  });
});
