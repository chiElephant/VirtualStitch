'use client';

import { useState } from 'react';
import CustomButton from './CustomButton';
import { downloadCanvasToImage, downloadImageToFile } from '@/config/helpers';
import { toast } from 'react-toastify';

interface ImageDownloadProps {
  activeFilterTab: string;
}

const ImageDownload = ({ activeFilterTab }: ImageDownloadProps) => {
  const [fileName, setFileName] = useState('');

  const handleDownload = (type: 'canvas' | 'image', tab?: string) => {
    let success = false;
    if (type === 'canvas') {
      success = downloadCanvasToImage(fileName.trim() || 'canvas');
      if (!success) {
        toast.error('No canvas found to download.', {
          position: 'top-center',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
        });
      }
    } else if (type === 'image') {
      success = downloadImageToFile(fileName.trim() || 'image', tab || '');
      if (!success) {
        toast.error(
          'No decal found to download. Please generate or upload an image first.',
          {
            position: 'top-center',
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: 'colored',
          }
        );
      }
    }
    if (success) {
      setFileName('');
    }
  };

  return (
    <div className='imagedownload-container'>
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
          onChange={(e) => setFileName(e.target.value)}
          className='border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-color'
        />
      </div>

      <div className='mt-4 flex flex-wrap gap-3'>
        <CustomButton
          type='filled'
          title='Download Shirt'
          handleClick={() => handleDownload('canvas')}
          disabled={!fileName.trim()}
          customStyles='w-fit px-4 py-2.5 font-bold text-sm'
        />
        <CustomButton
          type='filled'
          title='Download Logo'
          handleClick={() => handleDownload('image', activeFilterTab)}
          disabled={!fileName.trim() || !activeFilterTab}
          customStyles='w-fit px-4 py-2.5 font-bold text-sm'
        />
      </div>
    </div>
  );
};

export default ImageDownload;
