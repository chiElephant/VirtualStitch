import { proxy } from 'valtio';

const state = proxy({
  intro: true,
  color: '#efbd4e',
  isLogoTexture: true,
  isFullTexture: false,
  logoDecal: './icons/threejs.png',
  fullDecal: './icons/threejs.png',
});

export default state;
