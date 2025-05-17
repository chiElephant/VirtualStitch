'use client';

import { useState } from 'react';
import CustomButton from './CustomButton';
import { handleImageDownload } from '@/config/helpers';
import { DEFAULT_LOGO, DEFAULT_FULL } from '@/config/constants';
import state from '@/store';

interface ImageDownloadProps {
  activeFilterTab: string;
}

const ImageDownload = ({ activeFilterTab }: ImageDownloadProps) => {
  const [fileName, setFileName] = useState('');

  return (
    <div
      className='imagedownload-container'
      data-testid='image-download'>
      <div className='flex-1 flex flex-col'>
        <label
          htmlFor='image-download'
          className='imagedownload-label'>
          Filename
        </label>
        <input
          id='image-download'
          type='text'
          placeholder='e.g., my-shirt'
          value={fileName}
          onChange={(e) => setFileName(e.target.value.trim())}
          className='border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-color'
        />
      </div>

      <div className='mt-4 flex flex-wrap gap-3'>
        <CustomButton
          type='filled'
          title='Download Shirt'
          handleClick={() =>
            handleImageDownload('canvas', fileName, activeFilterTab, () =>
              setFileName('')
            )
          }
          disabled={
            !fileName.trim() ||
            !activeFilterTab ||
            (activeFilterTab === 'logoShirt' &&
              state.logoDecal === DEFAULT_LOGO) ||
            (activeFilterTab === 'stylishShirt' &&
              state.fullDecal === DEFAULT_FULL)
          }
          customStyles='w-fit px-4 py-2.5 font-bold text-sm'
        />
        <CustomButton
          type='filled'
          title={
            activeFilterTab === 'stylishShirt' ? 'Download Pattern' : (
              'Download Logo'
            )
          }
          handleClick={() =>
            handleImageDownload('image', fileName, activeFilterTab, () =>
              setFileName('')
            )
          }
          disabled={
            !fileName.trim() ||
            !activeFilterTab ||
            (activeFilterTab === 'logoShirt' &&
              state.logoDecal === DEFAULT_LOGO) ||
            (activeFilterTab === 'stylishShirt' &&
              state.fullDecal === DEFAULT_FULL)
          }
          customStyles='w-fit px-4 py-2.5 font-bold text-sm'
        />
      </div>
    </div>
  );
};

export default ImageDownload;
