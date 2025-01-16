/* eslint-disable @typescript-eslint/no-unused-vars */
import { StaticImageData } from 'next/image';

type Tab = {
  name: string;
  icon: StaticImageData;
};

interface TabProps {
  key: string;
  tab: Tab;
  handleClick: () => void;
  isFilterTab?: boolean;
  isActiveTab?: string;
}

const Tab = ({ key, tab, handleClick, isFilterTab, isActiveTab }: TabProps) => {
  return <div>Tab</div>;
};

export default Tab;
