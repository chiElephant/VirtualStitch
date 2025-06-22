// components/FilePicker.tsx
import { Dispatch, SetStateAction, useState } from 'react';
import { toast } from 'react-toastify';
import CustomButton from './CustomButton';
import { validateImageFileComplete } from '../config/fileValidation';

interface FilePickerProps {
  file: File | null;
  setFile: Dispatch<SetStateAction<File | null>>;
  readFile: (type: 'logo' | 'full') => void;
}

const FilePicker = ({ file, setFile, readFile }: FilePickerProps) => {
  const [isValidating, setIsValidating] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsValidating(true);

    try {
      // Validate the file completely
      const validationResult = await validateImageFileComplete(selectedFile);

      if (validationResult.isValid) {
        setFile(selectedFile);
        toast.success('File uploaded successfully!', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
        });
      } else {
        // Clear the input
        e.target.value = '';
        setFile(null);

        toast.error(validationResult.error || 'Invalid file selected.', {
          position: 'top-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
        });
      }
    } catch (error) {
      console.error('File validation error:', error);
      e.target.value = '';
      setFile(null);

      toast.error('Failed to process file. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleReadFile = (type: 'logo' | 'full') => {
    if (!file) {
      toast.warn('Please select a file first.', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored',
      });
      return;
    }

    try {
      readFile(type);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to apply image. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored',
      });
    }
  };

  return (
    <div
      className='filepicker-container'
      data-testid='file-picker'>
      <div className='flex-1 flex flex-col'>
        <input
          id='file-upload'
          type='file'
          accept='image/*'
          data-testid='file-picker-input'
          onChange={handleFileChange}
          disabled={isValidating}
          aria-label='Upload image file for customization'
          aria-describedby='file-help'
        />
        <label
          htmlFor='file-upload'
          className={`filepicker-label ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {isValidating ? 'Validating...' : 'Upload File'}
        </label>
        <div
          id='file-help'
          className='sr-only'>
          Choose an image file to upload. Supported formats: PNG, JPG, SVG.
          Maximum size: 10MB.
        </div>
        <p className='mt-2 text-gray-500 text-xs truncate'>
          {!file ? 'No file selected' : file.name}
        </p>
        {isValidating && (
          <p className='mt-1 text-blue-500 text-xs'>
            Checking file validity...
          </p>
        )}
      </div>

      <div className='mt-4 flex flex-wrap gap-3'>
        <CustomButton
          type='outline'
          title='Logo'
          handleClick={() => handleReadFile('logo')}
          customStyles='text-xs'
          disabled={!file || isValidating}
          aria-label='Apply uploaded image as small logo'
        />
        <CustomButton
          type='filled'
          title='Full Pattern'
          handleClick={() => handleReadFile('full')}
          customStyles='text-xs'
          disabled={!file || isValidating}
          aria-label='Apply uploaded image as full shirt pattern'
        />
      </div>
    </div>
  );
};

export default FilePicker;
