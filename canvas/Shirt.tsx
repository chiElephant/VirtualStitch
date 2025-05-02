import { easing } from 'maath';
import { useSnapshot } from 'valtio';
import { useFrame } from '@react-three/fiber';
import { Decal, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

import state from '../store';
const Shirt = () => {
  const snap = useSnapshot(state);
  const { nodes, materials } = useGLTF('/icons/shirt_baked.glb');
  const logoTexture = useTexture(snap.logoDecal);
  const fullTexture = useTexture(snap.fullDecal);

  useFrame((state, delta) => {
    easing.dampC(
      (materials.lambert1 as THREE.MeshStandardMaterial).color,
      snap.color,
      0.25,
      delta
    );
  });
  const stateString = JSON.stringify(snap);
  return (
    <group key={stateString}>
      <mesh
        castShadow
        geometry={(nodes.T_Shirt_male as THREE.Mesh).geometry}
        material={materials.lambert1}
        material-roughness={1}
        dispose={null}>
        {snap.isFullTexture && (
          <Decal
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={0.85}
            map={fullTexture}
          />
        )}
        {snap.isLogoTexture && (
          <Decal
            position={[0, 0.04, 0.15]}
            rotation={[0, 0, 0]}
            scale={0.15}
            map={logoTexture}
            depthTest={false}
          />
        )}
      </mesh>
    </group>
  );
};

export default Shirt;
