import {
  transition,
  slideAnimation,
  fadeAnimation,
  headTextAnimation,
  headContentAnimation,
  headContainerAnimation,
} from '../motion';

describe('motion constants', () => {
  it('should define transition with correct properties', () => {
    expect(transition).toEqual({ type: 'spring', duration: 0.8 });
  });

  it('should return correct slideAnimation for left', () => {
    const result = slideAnimation('left');
    expect(result.initial.x).toBe(-100);
    expect(result.initial.y).toBe(0);
    expect(result.animate.x).toBe(0);
    expect(result.animate.y).toBe(0);
    expect(result.exit.x).toBe(-100);
    expect(result.exit.y).toBe(0);
  });

  it('should return correct slideAnimation for right', () => {
    const result = slideAnimation('right');
    expect(result.initial.x).toBe(100);
    expect(result.initial.y).toBe(0);
    expect(result.exit.x).toBe(100);
    expect(result.exit.y).toBe(0);
  });

  it('should return correct slideAnimation for up', () => {
    const result = slideAnimation('up');
    expect(result.initial.x).toBe(0);
    expect(result.initial.y).toBe(100);
    expect(result.exit.x).toBe(0);
    expect(result.exit.y).toBe(100);
  });

  it('should return correct slideAnimation for down', () => {
    const result = slideAnimation('down');
    expect(result.initial.x).toBe(0);
    expect(result.initial.y).toBe(-100);
    expect(result.exit.x).toBe(0);
    expect(result.exit.y).toBe(-100);
  });

  it('should define fadeAnimation with opacity changes', () => {
    expect(fadeAnimation.initial.opacity).toBe(0);
    expect(fadeAnimation.animate.opacity).toBe(1);
    expect(fadeAnimation.exit.opacity).toBe(0);
  });

  it('should define headTextAnimation correctly', () => {
    expect(headTextAnimation.initial).toEqual({ x: 100, opacity: 0 });
    expect(headTextAnimation.animate).toEqual({ x: 0, opacity: 1 });
    expect(headTextAnimation.transition).toHaveProperty('type', 'spring');
  });

  it('should define headContentAnimation correctly', () => {
    expect(headContentAnimation.initial).toEqual({ y: 100, opacity: 0 });
    expect(headContentAnimation.animate).toEqual({ y: 0, opacity: 1 });
    expect(headContentAnimation.transition).toHaveProperty('type', 'spring');
  });

  it('should define headContainerAnimation correctly', () => {
    expect(headContainerAnimation.initial).toHaveProperty('x', -100);
    expect(headContainerAnimation.animate).toHaveProperty('x', 0);
    expect(headContainerAnimation.exit).toHaveProperty('x', -100);
  });
});
