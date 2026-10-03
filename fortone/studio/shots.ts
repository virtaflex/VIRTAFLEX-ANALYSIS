import type { ShotConfig } from './scene.ts';

export const FPS = 30;

const still = (o: Partial<ShotConfig>): ShotConfig => ({
  width: 900,
  height: 1125,
  transparent: true,
  container: 'cone',
  colorA: '#fff1dc',
  topping: 'none',
  loop: 12,
  offsetX: 0,
  offsetY: -0.1,
  distance: 12.5,
  tilt: 0,
  atmosphere: false,
  yaw: 0.6,
  seed: 7,
  ...o,
});

/** One render per flavour — ids must match src/config/flavors.ts `image`. */
export const stills: Record<string, ShotConfig> = {
  'flavor-vanilla': still({ colorA: '#fff1dc', topping: 'sprinkles' }),
  'flavor-chocolate': still({ colorA: '#6b3a26', topping: 'crumbs', drizzle: '#3b1d12', seed: 3 }),
  'flavor-twist': still({ colorA: '#fff1dc', colorB: '#6b3a26', topping: 'none', seed: 4 }),
  'flavor-strawberry': still({ colorA: '#f6b3c0', topping: 'sprinkles', drizzle: '#c2304f', seed: 9 }),
  'flavor-pistachio': still({ colorA: '#cfe0a6', container: 'cup', topping: 'pistachio', seed: 11 }),
  'flavor-mango': still({ colorA: '#ffd98a', colorB: '#fff1dc', container: 'cup', topping: 'mango', seed: 12 }),
  'flavor-caramel': still({ colorA: '#ecc58f', topping: 'crumbs', drizzle: '#b86a1c', seed: 5 }),
  'flavor-hazelnut': still({ colorA: '#a7714a', colorB: '#fff1dc', container: 'cup', topping: 'crumbs', drizzle: '#4a2414', seed: 6 }),
};

const hero = (o: Partial<ShotConfig>): ShotConfig => ({
  ...still({}),
  transparent: false,
  colorA: '#fff3e2',
  colorB: '#f6b3c0',
  topping: 'sprinkles',
  atmosphere: true,
  yaw: 0,
  seed: 21,
  ...o,
});

export const heroShots: Record<string, ShotConfig> = {
  'hero-desktop': hero({ width: 1920, height: 1080, offsetX: 2.25, offsetY: 0.05, distance: 11.2, tilt: -0.1 }),
  'hero-mobile': hero({ width: 720, height: 1280, offsetX: 0, offsetY: 1.35, distance: 17.5, tilt: -0.06 }),
};
