'use client';
import { useSnapshot } from 'valtio';
import state from '@/store';
import { getContrastingColor } from '@/config/helpers';

export interface CustomButtonProps {
  type: string;
  title: string;
  handleClick: () => void;
  customStyles: string;
}

const CustomButton = ({
  type,
  title,
  handleClick,
  customStyles,
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
      className={`px-2 py-1.5 flex-1 rounded-md ${customStyles}`}
      style={generateStyle(type)}
      onClick={handleClick}>
      {title}
    </button>
  );
};

export default CustomButton;
