import Image, { StaticImageData } from 'next/image';
import { useSnapshot } from 'valtio';

import state from '../store';

type Tab = {
  name: string;
  icon: StaticImageData;
};

interface TabProps {
  tab: Tab;
  handleClick: () => void;
  isFilterTab?: boolean;
  isActiveTab?: string | boolean;
}

const Tab = ({
  tab,
  handleClick,
  isFilterTab,
  isActiveTab,
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
      style={activeStyles}
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
