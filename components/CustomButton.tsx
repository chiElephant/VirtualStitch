'use client';
import { useSnapshot } from 'valtio';
import state from '@/store';
import { getContrastingColor } from '@/config/helpers';

export interface CustomButtonProps {
  type: string;
  title: string;
  handleClick?: () => void;
  customStyles: string;
  disabled?: boolean;
}

const CustomButton = ({
  type,
  title,
  handleClick,
  customStyles,
  disabled = false,
}: CustomButtonProps) => {
  const snap = useSnapshot(state);
  const generateStyle = (type: string) => {
    if (type === 'filled') {
      return {
        backgroundColor: snap.color,
        color: getContrastingColor(snap.color),
      };
    } else if (type === 'outlined') {
      return {
        borderWidth: '1px',
        borderColor: snap.color,
        color: snap.color,
      };
    }
  };
  return (
    <button
      className={`px-2 py-1.5 flex-1 rounded-md ${customStyles} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      style={generateStyle(type)}
      onClick={handleClick}
      disabled={disabled}>
      {title}
    </button>
  );
};

export default CustomButton;
