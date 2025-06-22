import Image, { StaticImageData } from 'next/image';
import { useSnapshot } from 'valtio';

import state from '@/store';

type Tab = {
  name: string;
  icon: StaticImageData;
};

interface TabProps {
  'tab': Tab;
  'handleClick': () => void;
  'isFilterTab'?: boolean;
  'isActiveTab'?: string | boolean;
  'data-testid'?: string;
  'data-is-active'?: boolean;
}

const Tab = ({
  tab,
  handleClick,
  isFilterTab,
  isActiveTab,
  'data-testid': testId,
  'data-is-active': isActive,
  ...props
}: TabProps) => {
  const snap = useSnapshot(state);

  const activeStyles =
    isFilterTab && isActiveTab ?
      { backgroundColor: snap.color, opacity: 0.5 }
    : { backgroundColor: 'transparent', opacity: 1 };

  return (
    <div
      key={tab.name}
      className={`tab-btn ${isFilterTab ? 'rounded-full glassmorphism' : 'rounded-4'}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      style={activeStyles}
      data-testid={testId}
      data-is-active={isActive}
      tabIndex={0}
      role='button'
      aria-label={`${
        isFilterTab ?
          tab.name === 'logoShirt' ? 'Small texture filter tab'
          : tab.name === 'stylishShirt' ? 'Full texture filter tab'
          : tab.name + ' filter tab'
        : tab.name + ' editor tab'
      }${isActiveTab ? ' (active)' : ''}`}
      aria-pressed={isFilterTab ? !!isActiveTab : undefined}
      {...props}>
      <Image
        src={tab.icon}
        alt={tab.name}
        className={`${isFilterTab ? 'w-2/3 h-2/3' : 'w-11/12 h-11/12 object-contain'}`}
      />
    </div>
  );
};

export default Tab;
