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
  color: '#007938', // Changed to accessible green that meets WCAG contrast requirements
  isLogoTexture: false,
  isFullTexture: false,
  logoDecal: './icons/logo.png',
  fullDecal: './icons/pattern.png',
});

export default state;
