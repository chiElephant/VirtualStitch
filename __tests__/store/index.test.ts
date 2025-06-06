// Replace the entire content of __tests__/store/index.test.ts with this:

// eslint-disable-next-line @typescript-eslint/no-require-imports
import store from '@/store';

import { proxy } from 'valtio';

// Extract exports from the required module
const state = store;

describe('Store Coverage Test', () => {
  it('forces store module execution for coverage', () => {
    // Access the state object to ensure module execution
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');

    // Test each property to ensure the object literal is covered
    expect(state).toHaveProperty('intro');
    expect(state).toHaveProperty('color');
    expect(state).toHaveProperty('isLogoTexture');
    expect(state).toHaveProperty('isFullTexture');
    expect(state).toHaveProperty('logoDecal');
    expect(state).toHaveProperty('fullDecal');
  });

  it('tests proxy functionality', () => {
    // Test that state behaves like a proxy
    const originalColor = state.color;
    state.color = '#CHANGED';
    expect(state.color).toBe('#CHANGED');

    // Test direct proxy creation to cover proxy() usage
    const testProxy = proxy({ test: true });
    expect(testProxy.test).toBe(true);

    // Restore state
    state.color = originalColor;
  });

  it('covers all state properties', () => {
    // Test initial values
    expect(typeof state.intro).toBe('boolean');
    expect(typeof state.color).toBe('string');
    expect(typeof state.isLogoTexture).toBe('boolean');
    expect(typeof state.isFullTexture).toBe('boolean');
    expect(typeof state.logoDecal).toBe('string');
    expect(typeof state.fullDecal).toBe('string');
  });

  it('tests state mutations', () => {
    // Test all property assignments
    state.intro = false;
    state.color = '#123456';
    state.isLogoTexture = true;
    state.isFullTexture = false;
    state.logoDecal = 'test.png';
    state.fullDecal = 'test2.png';

    expect(state.intro).toBe(false);
    expect(state.color).toBe('#123456');
    expect(state.isLogoTexture).toBe(true);
    expect(state.isFullTexture).toBe(false);
    expect(state.logoDecal).toBe('test.png');
    expect(state.fullDecal).toBe('test2.png');
  });
});
