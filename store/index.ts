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
  color: '#EFBD4E',
  isLogoTexture: false,
  isFullTexture: false,
  logoDecal: './icons/emblem.png',
  fullDecal: './icons/emblem.png',
});

export default state;
