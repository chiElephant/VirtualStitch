// canvas/Shirt.tsx
import { easing } from 'maath';
import { useSnapshot } from 'valtio';
import { useFrame } from '@react-three/fiber';
import { Decal, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo } from 'react';

import state from '@/store';
import { DEFAULT_LOGO, DEFAULT_FULL } from '@/config/constants';

// Helper function to validate texture URLs
const validateTextureUrl = (url: string, fallback: string): string => {
  try {
    if (typeof url !== 'string') return fallback;

    // Check for valid URL patterns
    if (
      url.startsWith('data:image/') ||
      url.startsWith('./') ||
      url.startsWith('/') ||
      url.startsWith('http')
    ) {
      return url;
    }

    console.warn('Invalid texture URL format, using fallback:', url);
    return fallback;
  } catch (error) {
    console.error('Error validating texture URL:', error);
    return fallback;
  }
};

const Shirt = () => {
  const snap = useSnapshot(state);
  const { nodes, materials } = useGLTF('/icons/shirt_baked.glb');

  // Always validate URLs before passing to useTexture
  const logoUrl = useMemo(
    () => validateTextureUrl(snap.logoDecal, DEFAULT_LOGO),
    [snap.logoDecal]
  );

  const fullUrl = useMemo(
    () => validateTextureUrl(snap.fullDecal, DEFAULT_FULL),
    [snap.fullDecal]
  );

  // Always call useTexture hooks (React compliance)
  // If URLs are invalid, they'll fallback to defaults which should always work
  const logoTexture = useTexture(logoUrl);
  const fullTexture = useTexture(fullUrl);

  useFrame((state, delta) => {
    try {
      easing.dampC(
        (materials.lambert1 as THREE.MeshStandardMaterial).color,
        snap.color,
        0.25,
        delta
      );
    } catch (error) {
      console.error('Error updating material color:', error);
    }
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
        {snap.isFullTexture && fullTexture && (
          <Decal
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={0.85}
            map={fullTexture}
          />
        )}
        {snap.isLogoTexture && logoTexture && (
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
