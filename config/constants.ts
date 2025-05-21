import {
  swatch,
  fileIcon,
  ai,
  logoShirt,
  stylishShirt,
  download,
} from '@/public/assets';

export const EditorTabs = [
  {
    name: 'colorPicker',
    icon: swatch,
  },
  {
    name: 'filePicker',
    icon: fileIcon,
  },
  {
    name: 'aiPicker',
    icon: ai,
  },
  {
    name: 'imageDownload',
    icon: download,
  },
];

export const FilterTabs = [
  {
    name: 'logoShirt',
    icon: logoShirt,
  },
  {
    name: 'stylishShirt',
    icon: stylishShirt,
  },
];

export const DecalTypes: {
  [key: string]: { stateProperty: string; filterTab: string };
} = {
  logo: {
    stateProperty: 'logoDecal',
    filterTab: 'logoShirt',
  },
  full: {
    stateProperty: 'fullDecal',
    filterTab: 'stylishShirt',
  },
};

// Default decal URLs
export const DEFAULT_LOGO = './icons/logo.png';
export const DEFAULT_FULL = './icons/pattern.png';
