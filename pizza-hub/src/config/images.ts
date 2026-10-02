/**
 * Image registry — every photo in /public/images is listed here with the widths
 * that exist on disk ("<key>-<width>.webp") and its aspect ratio.
 * To replace a photo, export new files with the same names, or add a new key
 * and point the menu item / section at it.
 */
export interface ImageEntry {
  widths: number[];
  /** width / height */
  ratio: number;
}

export const images: Record<string, ImageEntry> = {
  'brand/logo': { widths: [200, 400], ratio: 1.173 },
  'brand/logo-full': { widths: [600], ratio: 1.083 },
  'menu/cheese': { widths: [400, 720], ratio: 1.4969 },
  'menu/chicken-bbq': { widths: [400, 720], ratio: 1.6107 },
  'menu/chicken-ranch': { widths: [400, 720], ratio: 1.6107 },
  'menu/dips': { widths: [400, 720], ratio: 1.6981 },
  'menu/drinks': { widths: [400, 720], ratio: 0.5665 },
  'menu/extra-toppings': { widths: [400, 720], ratio: 1.6107 },
  'menu/garlic-bread': { widths: [400, 720], ratio: 1.1901 },
  'menu/margherita': { widths: [400, 720], ratio: 1.6107 },
  'menu/mix-meat': { widths: [400, 720], ratio: 1.6107 },
  'menu/pepperoni': { widths: [400, 720], ratio: 1.8898 },
  'menu/pizza-hub-special': { widths: [400, 720], ratio: 1.9355 },
  'menu/sausage': { widths: [400, 720], ratio: 1.9048 },
  'menu/vegetarian': { widths: [400, 720], ratio: 1.6107 },
  'photos/box': { widths: [640, 1024, 1600], ratio: 1.4815 },
  'photos/box-velvet': { widths: [640, 1024, 1600], ratio: 1.5459 },
  'photos/cheese-pull': { widths: [640, 1024, 1600], ratio: 1.4781 },
  'photos/cheese-pull-steam': { widths: [480, 800, 1200], ratio: 1.1019 },
  'photos/delivery': { widths: [480, 800, 1200], ratio: 1.1331 },
  'photos/dough': { widths: [480, 800, 1200], ratio: 1.1189 },
  'photos/hero': { widths: [640, 1024, 1600], ratio: 1.094 },
  'photos/packaging': { widths: [480, 800, 1200], ratio: 1.0485 },
  'photos/phone-order': { widths: [480, 800, 1200], ratio: 0.9864 },
  'photos/pizza-and-box': { widths: [480, 800, 1200], ratio: 1.25 },
  'photos/toppings': { widths: [480, 800, 1200], ratio: 1.2862 },
};
