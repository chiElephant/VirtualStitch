'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSnapshot } from 'valtio';
import Image from 'next/image';

import state from '../store';
import {
  headContainerAnimation,
  headContentAnimation,
  headTextAnimation,
  slideAnimation,
} from '../config/motion';
import { CustomButton } from '../components';

const Home = (props: React.ComponentProps<typeof motion.section>) => {
  const snap = useSnapshot(state);

  return (
    <AnimatePresence>
      {snap.intro && (
        <motion.section
          className='home'
          {...slideAnimation('left')}
          {...props}>
          <motion.header {...slideAnimation('down')}>
            <Image
              src={'/icons/emblem.png'}
              alt={'logo'}
              width={32}
              height={32}
              className='w-8 h-8 object-contain'
              priority
            />
          </motion.header>
          <motion.div
            className='home-content'
            {...headContainerAnimation}>
            <motion.div {...headTextAnimation}>
              <h1 className='head-text'>
                LET&#39;S <br className='xl:block hidden' />
                DO IT.
              </h1>
            </motion.div>
            <motion.div
              {...headContentAnimation}
              className='flex flex-col gap-5'>
              <p className='m-w-md font-normal text-gray-600 text-base'>
                Create your unique and exclusive shirt with our 3D customization
                tool. <strong> Unleash your Imagination </strong> and define
                your style.{' '}
              </p>

              <CustomButton
                type={'filled'}
                title={'Customize It'}
                handleClick={() => (state.intro = false)}
                customStyles={'w-fit px-4 py-2.5 font-bold text-sm'}
              />
            </motion.div>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default Home;
