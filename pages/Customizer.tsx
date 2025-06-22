/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSnapshot } from 'valtio';

import state, { State } from '@/store';
import { reader, safeFileReader } from '@/config/helpers';
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

      // Handle various API error states with specific toasts for better UX.
      // - 400: Validation error (malicious content, etc.)
      // - 429: Rate limiting (too many requests)
      // - 500: AI service/server-side error
      // - fallback: catch-all unexpected error
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Unknown error';
        
        if (response.status === 400) {
          toast.error(errorMessage, {
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
        } else if (response.status === 429) {
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

  // Update this section in pages/Customizer.tsx

  const readFile = async (type: 'logo' | 'full') => {
    if (!file) {
      toast.warn('Please select a file first.', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored',
        transition: Flip,
      });
      return;
    }

    try {
      // Use the safe file reader with error handling
      const result = await safeFileReader(file);

      if (result) {
        handleDecals(type, result);
        setActiveEditorTab('');

        toast.success('Image applied successfully ✅', {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
          transition: Flip,
        });
      }
      // If result is null, error was already handled by safeFileReader
    } catch (error) {
      console.error('Error processing file:', error);

      toast.error('Failed to process file. Please try a different image.', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored',
        transition: Flip,
      });
    }
  };

  const activeFilterKey =
    Object.keys(activeFilterTab).find((key) => activeFilterTab[key]) || '';

  // Maps editor tab keys to their corresponding components for rendering.
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

  // Dynamically render the currently active editor tab component (e.g. ColorPicker, AIPicker).
  const generateTabContent = () =>
    activeEditorTab ? tabContentMap[activeEditorTab] : null;

  /**
   * Applies the given decal image (logo or full) to the 3D model state.
   * - Maps the `type` to the corresponding decal type (logo or full texture).
   * - Dynamically sets the image data on the correct Valtio state key.
   * - Updates the filter tab UI and texture toggle booleans accordingly.
   */
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

  /**
   * Toggles the active state of a filter tab and updates the corresponding
   * global state (isLogoTexture or isFullTexture) for the 3D model render logic.
   */
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
                    data-is-active={activeFilterTab[tab.name]}
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
