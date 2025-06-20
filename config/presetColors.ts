// Preset colors for the VirtualStitch color picker
// These colors are used both in the application and in tests

export const presetColors = [
  '#007938', // Default green
  '#2CCCE4', // Light blue
  '#80C670', // Green
  '#726DE8', // Purple
  '#353934', // Dark
  '#FF6B6B', // Red
  '#EFBD4E', // Yellow
  '#C9FFE5', // Cyan
  '#CCCCCC', // Light gray
];

export type PresetColor = (typeof presetColors)[number];

// Color categories for testing and organization
export const colorCategories = {
  primary: '#007938',
  secondary: '#2CCCE4',
  accent: '#80C670',
  neutral: '#353934',
  warning: '#EFBD4E',
  success: '#80C670',
  info: '#2CCCE4',
  light: '#C9FFE5',
  dark: '#353934',
} as const;

// Default color for initialization
export const DEFAULT_COLOR = '#007938';

// Color validation helper
export function isValidPresetColor(color: string): color is PresetColor {
  return presetColors.includes(color as PresetColor);
}

// Get color name from hex value (for testing)
export function getColorName(hex: string): string {
  const colorMap: Record<string, string> = {
    '#007938': 'Default Green',
    '#2CCCE4': 'Light Blue',
    '#80C670': 'Green',
    '#726DE8': 'Purple',
    '#353934': 'Dark',
    '#FF6B6B': 'Red',
    '#EFBD4E': 'Yellow',
    '#C9FFE5': 'Cyan',
    '#CCCCCC': 'Light Gray',
  };

  return colorMap[hex] || 'Unknown Color';
}

export default presetColors;
