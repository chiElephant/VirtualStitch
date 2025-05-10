/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { act } from 'react';
import { proxy } from 'valtio';
import { render, fireEvent } from '@testing-library/react';
import Home from '@/pages/Home';
import state from '@/store';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (
    props: {
      src?: string;
      alt?: string;
      priority?: boolean;
      placeholder?: string;
      blurDataURL?: string;
    } & Record<string, unknown>
  ) => {
    const {
      src = '',
      alt = '',
      priority,
      placeholder,
      blurDataURL,
      ...rest
    } = props;
    return React.createElement('img', {
      src,
      alt,
      ...rest,
    });
  },
}));

jest.mock('framer-motion', () => {
  const MotionSection = React.forwardRef(
    (
      props: React.ComponentPropsWithoutRef<'section'>,
      ref: React.Ref<HTMLElement>
    ) => React.createElement('section', { ...props, ref })
  );
  MotionSection.displayName = 'MotionSection';

  const MotionHeader = React.forwardRef(
    (
      props: React.ComponentPropsWithoutRef<'header'>,
      ref: React.Ref<HTMLHeadingElement>
    ) => React.createElement('header', { ...props, ref })
  );
  MotionHeader.displayName = 'MotionHeader';

  const MotionDiv = React.forwardRef(
    (
      props: React.ComponentPropsWithoutRef<'div'>,
      ref: React.Ref<HTMLDivElement>
    ) => React.createElement('div', { ...props, ref })
  );
  MotionDiv.displayName = 'MotionDiv';

  const MotionH1 = React.forwardRef(
    (
      props: React.ComponentPropsWithoutRef<'h1'>,
      ref: React.Ref<HTMLHeadingElement>
    ) => React.createElement('h1', { ...props, ref })
  );
  MotionH1.displayName = 'MotionH1';

  const MotionP = React.forwardRef(
    (
      props: React.ComponentPropsWithoutRef<'p'>,
      ref: React.Ref<HTMLParagraphElement>
    ) => React.createElement('p', { ...props, ref })
  );
  MotionP.displayName = 'MotionP';

  return {
    ...jest.requireActual('framer-motion'),
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion: {
      ...jest.requireActual('framer-motion').motion,
      section: MotionSection,
      header: MotionHeader,
      div: MotionDiv,
      h1: MotionH1,
      p: MotionP,
    },
  };
});

jest.mock('@/store', () => {
  return {
    __esModule: true,
    default: proxy({
      intro: true,
      color: '',
      isLogoTexture: false,
      isFullTexture: false,
      logoDecal: '',
      fullDecal: '',
    }),
  };
});

describe('Home component', () => {
  beforeEach(() => {
    state.intro = true;
  });

  it('renders with intro true', () => {
    const { getByText } = render(React.createElement(Home));
    expect(getByText("LET'S DO IT.")).toBeInTheDocument();
  });

  it('does not render with intro false', () => {
    act(() => {
      state.intro = false;
    });
    const { queryByText } = render(React.createElement(Home));
    expect(queryByText("LET'S DO IT.")).not.toBeInTheDocument();
  });

  it('has correct src and alt on Image component', () => {
    const { container } = render(React.createElement(Home));
    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThanOrEqual(1);
    const found = Array.from(images).some((img) => {
      const alt = img.getAttribute('alt')?.toLowerCase() || '';
      const src = img.getAttribute('src') || '';
      return alt.includes('logo') && src.includes('/icons/emblem.png');
    });
    expect(found).toBe(true);
  });

  it('renders the CustomButton and can click it', async () => {
    const { findByRole } = render(React.createElement(Home));
    const button = await findByRole('button', { name: /customize it/i });
    expect(button).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(button);
    });

    expect(state.intro).toBe(false);
  });
});
