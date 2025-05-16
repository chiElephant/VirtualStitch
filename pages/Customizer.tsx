/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSnapshot } from 'valtio';

import state, { State } from '@/store';
import { reader } from '@/config/helpers';
import { EditorTabs, FilterTabs, DecalTypes } from '@/config/constants';
import { fadeAnimation, slideAnimation } from '@/config/motion';
import {
  AIPicker,
  ColorPicker,
  CustomButton,
  FilePicker,
  Tab,
  ImageDownload,
} from '@/components';
import { Flip, ToastContainer, toast } from 'react-toastify';

type EditorTab = 'colorPicker' | 'filePicker' | 'aiPicker' | 'imageDownload';

interface FilterTab {
  logoShirt: boolean;
  stylishShirt: boolean;
  [key: string]: boolean;
}

type CustomizerProps = React.HTMLAttributes<HTMLDivElement>;
const Customizer = (props: CustomizerProps) => {
  const snap = useSnapshot(state);

  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatingImg, setGeneratingImg] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab | ''>('');
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>({
    logoShirt: false,
    stylishShirt: false,
  });

  const handleSubmit = async (type: 'logo' | 'full') => {
    if (!prompt) {
      toast.warn('Please enter a prompt ✍️ ', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
        transition: Flip,
      });
      return; // ✅ stop execution if no prompt
    }

    try {
      setGeneratingImg(true);

      const response = await fetch('/api/custom-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(
            'You are making requests too quickly 🚫. Please wait a minute.',
            {
              position: 'bottom-right',
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: false,
              draggable: true,
              progress: undefined,
              theme: 'colored',
              transition: Flip,
            }
          );
        } else if (response.status === 500) {
          toast.error('Server error while generating the image ⚠️.', {
            position: 'bottom-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'colored',
            transition: Flip,
          });
        } else {
          toast.error('Unexpected error occurred ❌.', {
            position: 'bottom-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'colored',
            transition: Flip,
          });
        }
        return;
      }

      const data = await response.json();
      handleDecals(type, `data:image/png;base64,${data.photo}`);

      toast.success('Image applied successfully ✅', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
        transition: Flip,
      });
    } catch (error) {
      toast.error('Failed to fetch image 📸 ', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'colored',
        transition: Flip,
      });
    } finally {
      setGeneratingImg(false);
      setActiveEditorTab('');
    }
  };

  const readFile = async (type: 'logo' | 'full') => {
    if (!file) return;
    const result = (await reader(file)) as string;
    handleDecals(type, result);
    setActiveEditorTab('');
  };

  const activeFilterKey =
    Object.keys(activeFilterTab).find((key) => activeFilterTab[key]) || '';

  const tabContentMap = {
    colorPicker: <ColorPicker />,
    filePicker: (
      <FilePicker
        file={file}
        setFile={setFile}
        readFile={readFile}
      />
    ),
    aiPicker: (
      <AIPicker
        prompt={prompt}
        setPrompt={setPrompt}
        generatingImg={generatingImg}
        handleSubmit={handleSubmit}
      />
    ),
    imageDownload: <ImageDownload activeFilterTab={activeFilterKey} />,
  };

  const generateTabContent = () =>
    activeEditorTab ? tabContentMap[activeEditorTab] : null;

  const handleDecals = (type: string, result: string) => {
    const decalType = DecalTypes[type];

    (state[decalType.stateProperty as keyof State] as string) = result;

    // Automatically activate the correct filter tab
    setActiveFilterTab((prev) => {
      const updated = { ...prev };

      Object.keys(updated).forEach((key) => {
        updated[key] = key === decalType.filterTab;
      });

      // Set state (e.g., isLogoTexture or isFullTexture) accordingly
      if (decalType.filterTab === 'logoShirt') {
        state.isLogoTexture = true;
        state.isFullTexture = false;
      } else if (decalType.filterTab === 'stylishShirt') {
        state.isLogoTexture = false;
        state.isFullTexture = true;
      }

      return updated;
    });
  };

  const handleActiveFilterTab = (tabName: string) => {
    const isActive = !activeFilterTab[tabName];

    if (tabName === 'logoShirt') {
      state.isLogoTexture = isActive;
    } else if (tabName === 'stylishShirt') {
      state.isFullTexture = isActive;
    }

    setActiveFilterTab((prev) => ({
      ...prev,
      [tabName]: isActive,
    }));
  };

  return (
    <div data-testid='customizer'>
      <ToastContainer />
      {!snap.intro && (
        <div data-testid='customizer-main'>
          <AnimatePresence {...props}>
            <>
              <motion.div
                key='customizer-motion'
                className='absolute top-0 left-0 z-10'
                {...slideAnimation('left')}>
                <div className='flex items-center min-h-screen'>
                  <div
                    data-testid='editor-tabs-container'
                    className='editortabs-container tabs'>
                    {EditorTabs.map((tab) => (
                      <Tab
                        key={`${tab.name}-editortab`}
                        tab={tab}
                        data-testid={`editor-tab-${tab.name}`}
                        handleClick={() => {
                          setActiveEditorTab((prev) =>
                            prev === (tab.name as EditorTab) ?
                              ''
                            : (tab.name as EditorTab)
                          );
                        }}
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
                  data-testid={`button-color-${snap.color.toUpperCase()}`}
                  handleClick={() => (state.intro = true)}
                  customStyles={'w-fit px-4 py-2.5 font-bold text-sm'}
                />
              </motion.div>
              <motion.div
                data-testid='filter-tabs-container'
                className='filtertabs-container'
                {...slideAnimation('up')}>
                {FilterTabs.map((tab) => (
                  <Tab
                    key={`${tab.name}-filtertab`}
                    tab={tab}
                    data-testid={`filter-tab-${tab.name}`}
                    isFilterTab
                    isActiveTab={activeFilterTab[tab.name]}
                    handleClick={() => handleActiveFilterTab(tab.name)}
                  />
                ))}
              </motion.div>
            </>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Customizer;
