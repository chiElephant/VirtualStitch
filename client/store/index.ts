import { proxy } from 'valtio';

const state = proxy({
  intro: true,
  color: '#EFBD48',
  isLogoTexture: false,
  isFullTexture: false,
  logoDecal: './icons/threejs.png',
  fullDecal: './icons/threejs.png',
});

export default state;
