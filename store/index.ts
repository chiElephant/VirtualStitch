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
  color: '#00C851',
  isLogoTexture: false,
  isFullTexture: false,
  logoDecal: './icons/logo.png',
  fullDecal: './icons/pattern.png',
});

export default state;
