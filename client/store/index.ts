import { proxy } from 'valtio';

export interface State {
  intro: boolean;
  color: string;
  isLogoTexture: boolean;
  isFullTexture: boolean;
  logoDecal: string;
  fullDecal: string;
}

const state = proxy({
  intro: true,
  color: '#EFBD48',
  isLogoTexture: false,
  isFullTexture: false,
  logoDecal: './icons/threejs.png',
  fullDecal: './icons/threejs.png',
});

export default state;
