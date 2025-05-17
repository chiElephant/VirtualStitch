import { SketchPicker } from 'react-color';
import { useSnapshot } from 'valtio';
import { presetColors } from '@/config/presetColors';

import state from '@/store';

const ColorPicker = () => {
  const snap = useSnapshot(state);
  return (
    <div
      className='absolute left-full ml-3'
      data-testid='color-picker'>
      <SketchPicker
        color={snap.color}
        disableAlpha
        onChange={(color) => (state.color = color.hex.toUpperCase())}
        presetColors={presetColors}
      />
    </div>
  );
};

export default ColorPicker;
