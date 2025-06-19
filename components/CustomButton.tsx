'use client';
import { useSnapshot } from 'valtio';
import { useEffect, useRef } from 'react';
import state from '@/store';
import { getContrastingColor } from '@/config/helpers';

export interface CustomButtonProps {
  'type': string;
  'title': string;
  'handleClick'?: () => void;
  'customStyles': string;
  'disabled'?: boolean;
  'data-testid'?: string;
}

const CustomButton = ({
  type,
  title,
  handleClick,
  customStyles,
  disabled = false,
  'data-testid': dataTestId,
}: CustomButtonProps) => {
  const snap = useSnapshot(state);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Force correct styles after render
  useEffect(() => {
    if (
      buttonRef.current &&
      (title === 'Customize It' || title === 'Go Back')
    ) {
      const button = buttonRef.current;

      // Nuclear option: force styles with maximum specificity
      button.style.setProperty(
        'background',
        snap.color.toLowerCase(),
        'important'
      );
      button.style.setProperty(
        'background-color',
        snap.color.toLowerCase(),
        'important'
      );
      button.style.setProperty(
        'color',
        getContrastingColor(snap.color),
        'important'
      );
      button.style.setProperty('backdrop-filter', 'none', 'important');
      button.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      button.style.setProperty('filter', 'none', 'important');
      button.style.setProperty('-webkit-filter', 'none', 'important');
      button.style.setProperty('box-shadow', 'none', 'important');
      button.style.setProperty('border', 'none', 'important');
      button.style.setProperty('opacity', '1', 'important');
      button.style.setProperty('isolation', 'isolate', 'important');
      button.style.setProperty('z-index', '1001', 'important');
      button.style.setProperty('background-image', 'none', 'important');
      button.style.setProperty('mix-blend-mode', 'normal', 'important');
      button.style.setProperty('position', 'relative', 'important');

      // Remove problematic classes
      button.classList.remove('glassmorphism');

      // Add accessibility class
      button.classList.add('accessibility-button');
    }
  }, [snap.color, title]);

  const generateStyle = (type: string): React.CSSProperties => {
    const baseColor = snap.color.toLowerCase();
    const textColor = getContrastingColor(snap.color);

    if (type === 'filled') {
      return {
        background: baseColor,
        backgroundColor: baseColor,
        color: textColor,
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        filter: 'none',
        boxShadow: 'none',
        border: 'none',
        opacity: 1,
        zIndex: 1001,
        backgroundImage: 'none',
        position: 'relative',
      } as React.CSSProperties;
    } else if (type === 'outlined') {
      return {
        borderWidth: '1px',
        borderColor: baseColor,
        color: baseColor,
        backgroundColor: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        filter: 'none',
        boxShadow: 'none',
        opacity: 1,
        backgroundImage: 'none',
        position: 'relative',
      } as React.CSSProperties;
    }
    return {};
  };

  return (
    <button
      ref={buttonRef}
      className={`accessibility-button px-2 py-1.5 flex-1 rounded-md ${customStyles} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      style={generateStyle(type)}
      onClick={handleClick}
      disabled={disabled}
      aria-label={title}
      data-testid={dataTestId}>
      {title}
    </button>
  );
};

export default CustomButton;
