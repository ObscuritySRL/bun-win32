import { describe, expect, test } from 'bun:test';

import { Characters, Spring } from './spring';

describe('Spring', () => {
  test('rests at its initial value until retargeted', () => {
    const spring = new Spring(Characters.exhale, 1, 0);
    expect(spring.value(5_000)).toBe(1);
    expect(spring.velocity(5_000)).toBe(0);
    expect(spring.settled(5_000)).toBe(true);
  });

  test('reaches its target', () => {
    for (const character of Object.values(Characters)) {
      const spring = new Spring(character, 0, 0);
      spring.retarget(1, 0);
      expect(spring.value(4_000)).toBeCloseTo(1, 4);
      expect(spring.settled(4_000)).toBe(true);
      expect(spring.settled(16)).toBe(false);
    }
  });

  test('retargeting mid-flight preserves position and velocity', () => {
    const spring = new Spring(Characters.rise, 0, 0);
    spring.retarget(100, 0);
    const before = spring.value(120);
    const velocityBefore = spring.velocity(120);
    spring.retarget(-40, 120);
    expect(spring.value(120)).toBeCloseTo(before, 9);
    expect(spring.velocity(120)).toBeCloseTo(velocityBefore, 9);
    expect(spring.target).toBe(-40);
  });

  test('critically damped characters never overshoot from rest', () => {
    const spring = new Spring(Characters.glide, 0, 0);
    spring.retarget(1, 0);
    let previous = 0;
    for (let time = 1; time < 2_000; time += 1) {
      const value = spring.value(time);
      expect(value).toBeLessThanOrEqual(1 + 1e-9);
      expect(value).toBeGreaterThanOrEqual(previous - 1e-12);
      previous = value;
    }
  });

  test('rise overshoots gently (between 1 % and 6 %)', () => {
    const spring = new Spring(Characters.rise, 0, 0);
    spring.retarget(1, 0);
    let peak = 0;
    for (let time = 0; time < 2_000; time += 1) peak = Math.max(peak, spring.value(time));
    expect(peak).toBeGreaterThan(1.01);
    expect(peak).toBeLessThan(1.06);
  });

  test('set jumps without animating', () => {
    const spring = new Spring(Characters.exhale, 0, 0);
    spring.retarget(10, 0);
    spring.set(3, 50);
    expect(spring.value(50)).toBe(3);
    expect(spring.value(60)).toBe(3);
    expect(spring.target).toBe(3);
  });
});
