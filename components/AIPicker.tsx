import { Dispatch, SetStateAction } from 'react';
import CustomButton from './CustomButton';

interface AIPickerProps {
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  generatingImg: boolean;
  handleSubmit: (type: 'logo' | 'full') => void;
}

const AIPicker = ({
  prompt,
  setPrompt,
  generatingImg,
  handleSubmit,
}: AIPickerProps) => {
  return (
    <div
      className='aipicker-container'
      data-testid='ai-picker'>
      <textarea
        data-testid='ai-prompt-input'
        placeholder='Ask AI...'
        rows={5}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className='aipicker-textarea'
        aria-label='AI image generation prompt'
        aria-describedby='prompt-help'
      />
      <div id='prompt-help' className='sr-only'>
        Describe the image you want to generate using AI. Be specific about colors, style, and content.
      </div>
      <div className='flex flex-wrap gap-3'>
        {generatingImg ?
          <CustomButton
            type='outline'
            title='Asking AI...'
            customStyles='text-xs'
          />
        : <>
            <CustomButton
              type={'outline'}
              title={'AI Logo'}
              data-testid='ai-logo-button'
              handleClick={() => handleSubmit('logo')}
              customStyles={'text-xs'}
            />
            <CustomButton
              type={'filled'}
              title={'AI Full'}
              data-testid='ai-full-button'
              handleClick={() => handleSubmit('full')}
              customStyles={'text-xs'}
            />
          </>
        }
      </div>
    </div>
  );
};

export default AIPicker;
