'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, Center } from '@react-three/drei';

import Shirt from './Shirt';
import Backdrop from './Backdrop';
import CameraRig from './CameraRig';
import { useSnapshot } from 'valtio';
import state from '@/store';

type CanvasModelProps = React.ComponentProps<typeof Canvas>;
const CanvasModel = (props: CanvasModelProps) => {
  const snap = useSnapshot(state);

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 35 }}
        gl={{ preserveDrawingBuffer: true }}
        className='w-full max-w-full h-full transition-all ease-in'
        {...props}>
        <ambientLight intensity={0.5} />
        <Environment preset='city' />
        <CameraRig>
          <Backdrop />
          <Center>
            <Shirt />
          </Center>
        </CameraRig>
      </Canvas>

      {/* For E2E testing purposes */}
      <div
        data-testid={snap.color.toLowerCase()}
        style={{ display: 'none' }}
      />
      {snap.isLogoTexture && (
        <div
          data-testid='logo-texture'
          style={{ display: 'none' }}></div>
      )}
      {snap.isFullTexture && (
        <div
          data-testid='full-texture'
          style={{ display: 'none' }}></div>
      )}
    </>
  );
};

export default CanvasModel;
