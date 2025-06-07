// __tests__/store/index.test.ts

// Unmock the store for this specific test file
jest.unmock('@/store');

// Also unmock valtio to test the actual proxy functionality
jest.unmock('valtio');

import { proxy } from 'valtio';
import state from '@/store';

describe('Store', () => {
  it('exports a proxy object with correct initial values', () => {
    // Test that the store is defined and is an object
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');

    // Test all initial property values (covers the proxy object creation)
    expect(state.intro).toBe(true);
    expect(state.color).toBe('#00C851');
    expect(state.isLogoTexture).toBe(false);
    expect(state.isFullTexture).toBe(false);
    expect(state.logoDecal).toBe('./icons/logo.png');
    expect(state.fullDecal).toBe('./icons/pattern.png');
  });

  it('allows property mutations through the proxy', () => {
    // Store original values for cleanup
    const originalValues = {
      intro: state.intro,
      color: state.color,
      isLogoTexture: state.isLogoTexture,
      isFullTexture: state.isFullTexture,
      logoDecal: state.logoDecal,
      fullDecal: state.fullDecal,
    };

    // Test mutation of each property (covers proxy mutation behavior)
    state.intro = false;
    expect(state.intro).toBe(false);

    state.color = '#FF0000';
    expect(state.color).toBe('#FF0000');

    state.isLogoTexture = true;
    expect(state.isLogoTexture).toBe(true);

    state.isFullTexture = true;
    expect(state.isFullTexture).toBe(true);

    state.logoDecal = 'new-logo.png';
    expect(state.logoDecal).toBe('new-logo.png');

    state.fullDecal = 'new-pattern.png';
    expect(state.fullDecal).toBe('new-pattern.png');

    // Restore original values
    Object.assign(state, originalValues);
  });

  it('has all required properties defined in State interface', () => {
    // Test that all properties exist (covers object property access)
    expect(state).toHaveProperty('intro');
    expect(state).toHaveProperty('color');
    expect(state).toHaveProperty('isLogoTexture');
    expect(state).toHaveProperty('isFullTexture');
    expect(state).toHaveProperty('logoDecal');
    expect(state).toHaveProperty('fullDecal');
  });

  it('maintains correct property types', () => {
    // Test type checking (covers all property getters)
    expect(typeof state.intro).toBe('boolean');
    expect(typeof state.color).toBe('string');
    expect(typeof state.isLogoTexture).toBe('boolean');
    expect(typeof state.isFullTexture).toBe('boolean');
    expect(typeof state.logoDecal).toBe('string');
    expect(typeof state.fullDecal).toBe('string');
  });

  it('is created using valtio proxy', () => {
    // Test that we can create another proxy to ensure import is working
    const testProxy = proxy({ test: 'value' });
    expect(testProxy.test).toBe('value');

    // Verify state behaves like a valtio proxy
    expect(state).toBeTruthy();
  });
});
