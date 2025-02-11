/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { proxy, useSnapshot } from 'valtio';

import config from '@/config/config';
import state, { State } from '@/store';
import { download } from '@/public/assets';
import { downloadCanvasToImage, reader } from '../config/helpers';
import { EditorTabs, FilterTabs, DecalTypes } from '@/config/constants';
import { fadeAnimation, slideAnimation } from '@/config/motion';
import {
  AIPicker,
  ColorPicker,
  CustomButton,
  FilePicker,
  Tab,
} from '@/components';

interface FilterTab {
  logoShirt: boolean;
  stylishShirt: boolean;
  [key: string]: boolean;
}

const Customizer = () => {
  const snap = useSnapshot(state);

  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatingImg, setGeneratingImg] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>({
    logoShirt: false,
    stylishShirt: false,
  });
  const generateTabContent = () => {
    switch (activeEditorTab) {
      case 'colorpicker':
        return <ColorPicker />;
      case 'filepicker':
        return (
          <FilePicker
            file={file}
            setFile={setFile}
            readFile={readFile}
          />
        );
      case 'aipicker':
        return (
          <AIPicker
            prompt={prompt}
            setPrompt={setPrompt}
            generatingImg={generatingImg}
            handleSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (type: 'logo' | 'full') => {
    if (!prompt) return alert('Please enter a prompt');

    try {
      setGeneratingImg(true);

      const response = await fetch(config.development.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await response.json();
      console.log(data);

      // handleDecals(type, `data:image/png;base64,${data.photo}`);
    } catch (error) {
      alert(error);
    } finally {
      setGeneratingImg(false);
      setActiveEditorTab('');
    }
  };

  const handleDecals = (type: string, result: string) => {
    const decalType = DecalTypes[type];

    (state[decalType.stateProperty as keyof State] as string) = result;
    handleActiveFilterTab(decalType.filterTab);
  };

  const handleActiveFilterTab = (tabName: string) => {
    switch (tabName) {
      case 'logoShirt':
        state.isLogoTexture = !activeFilterTab[tabName];
        break;
      case 'stylishShirt':
        state.isFullTexture = !activeFilterTab[tabName];
        break;
      default:
        state.isLogoTexture = false;
        state.isFullTexture = false;
    }

    setActiveFilterTab((prev) => ({
      ...prev,
      [tabName]: !prev[tabName],
    }));
  };

  const readFile = async (type: 'logo' | 'full') => {
    if (!file) return;
    const result = (await reader(file)) as string;
    handleDecals(type, result);
    setActiveEditorTab('');
  };

  return (
    <AnimatePresence>
      {!snap.intro && (
        <>
          <motion.div
            key={'custom'}
            className='absolute top-0 left-0 z-10'
            {...slideAnimation('left')}>
            <div className='flex items-center min-h-screen'>
              <div className='editortabs-container tabs'>
                {EditorTabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    tab={tab}
                    handleClick={() => setActiveEditorTab(tab.name)}
                  />
                ))}
                {generateTabContent()}
              </div>
            </div>
          </motion.div>
          <motion.div
            className='absolute z-10 top-5 right-5'
            {...fadeAnimation}>
            <CustomButton
              type={'filled'}
              title={'Go Back'}
              handleClick={() => (state.intro = true)}
              customStyles={'w-fit px-4 py-2.5 font-bold text-sm'}
            />
          </motion.div>
          <motion.div
            className='filtertabs-container'
            {...slideAnimation('up')}>
            {FilterTabs.map((tab) => (
              <Tab
                key={tab.name}
                tab={tab}
                isFilterTab
                isActiveTab={activeFilterTab[tab.name]}
                handleClick={() => handleActiveFilterTab(tab.name)}
              />
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Customizer;
