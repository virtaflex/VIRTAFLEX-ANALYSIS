/**
 * ─────────────────────────────────────────────────────────────
 *  PIZZA HUB — MENU
 *  Products, sizes, crusts, toppings and sauces live here.
 *  All prices are in EGP (whole pounds).
 *
 *  ⚠ SAMPLE PRICES: every price below is a placeholder so the ordering
 *  flow can be tested. Replace them with the real prices, then set
 *  `launch.samplePrices` to false in site.ts.
 *
 *  This file is shared with the order server, which re-calculates every
 *  order total from it — customers can't change prices from the browser.
 * ─────────────────────────────────────────────────────────────
 */

export type SizeId = 'small' | 'medium' | 'large' | 'family' | 'regular';

/** Display order + labels for sizes. A product only shows the sizes it has a price for. */
export const sizes: Record<SizeId, { label: string; note?: string }> = {
  small: { label: 'Small' },
  medium: { label: 'Medium' },
  large: { label: 'Large' },
  family: { label: 'Family' },
  regular: { label: 'Regular' },
};
export const sizeOrder: SizeId[] = ['small', 'medium', 'large', 'family', 'regular'];

/** A price can be flat, or depend on the chosen size. */
export type Price = number | Partial<Record<SizeId, number>>;

export interface Option {
  id: string;
  name: string;
  price: Price;
  /** For "quantity" groups: the most of this option per item */
  maxQty?: number;
}

export interface OptionGroup {
  id: string;
  title: string;
  subtitle?: string;
  /**
   * single   → pick exactly one (radio)
   * multi    → pick any number (checkbox), up to maxSelections
   * quantity → pick a quantity per option (stepper), e.g. sauces
   */
  type: 'single' | 'multi' | 'quantity';
  required?: boolean;
  defaultOptionId?: string;
  maxSelections?: number;
  options: Option[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export type Tag = 'bestseller' | 'new' | 'spicy' | 'veg' | 'signature';

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  /** Image key from config/images.ts, or a direct URL like "/uploads/margherita.jpg" */
  image: string;
  /** Price per size. Only these sizes are offered for this product. */
  prices: Partial<Record<SizeId, number>>;
  /** Which customization groups this product offers (ids from optionGroups) */
  optionGroupIds?: string[];
  tags?: Tag[];
  /** Shown in the home page menu preview */
  featured?: boolean;
  /** Set false to temporarily hide a product (sold out) */
  available?: boolean;
}

/* ───────────── Customization groups ───────────── */

export const optionGroups: Record<string, OptionGroup> = {
  crust: {
    id: 'crust',
    title: 'Choose your crust',
    type: 'single',
    required: true,
    defaultOptionId: 'classic',
    options: [
      { id: 'classic', name: 'Classic', price: 0 },
      { id: 'thin', name: 'Thin', price: 0 },
      { id: 'cheese-crust', name: 'Cheese crust', price: { small: 30, medium: 40, large: 50, family: 65 } },
    ],
  },
  cheese: {
    id: 'cheese',
    title: 'Extra cheese',
    subtitle: 'More mozzarella, more stretch',
    type: 'multi',
    options: [{ id: 'extra-cheese', name: 'Extra cheese', price: { small: 25, medium: 35, large: 45, family: 55 } }],
  },
  toppings: {
    id: 'toppings',
    title: 'Extra toppings',
    subtitle: 'Pick as many as you like',
    type: 'multi',
    maxSelections: 10,
    options: [
      { id: 'mozzarella', name: 'Extra mozzarella', price: { small: 20, medium: 30, large: 40, family: 50 } },
      { id: 'chicken', name: 'Chicken', price: { small: 30, medium: 40, large: 50, family: 60 } },
      { id: 'beef', name: 'Beef', price: { small: 35, medium: 45, large: 55, family: 65 } },
      { id: 'sausage', name: 'Sausage', price: { small: 25, medium: 35, large: 45, family: 55 } },
      { id: 'pastrami', name: 'Pastrami', price: { small: 25, medium: 35, large: 45, family: 55 } },
      { id: 'pepperoni', name: 'Pepperoni', price: { small: 25, medium: 35, large: 45, family: 55 } },
      { id: 'mushrooms', name: 'Mushrooms', price: { small: 10, medium: 15, large: 20, family: 25 } },
      { id: 'olives', name: 'Olives', price: { small: 10, medium: 15, large: 20, family: 25 } },
      { id: 'peppers', name: 'Peppers', price: { small: 10, medium: 15, large: 20, family: 25 } },
      { id: 'onions', name: 'Onions', price: { small: 10, medium: 15, large: 20, family: 25 } },
      { id: 'jalapenos', name: 'Jalapeños', price: { small: 10, medium: 15, large: 20, family: 25 } },
    ],
  },
  sauces: {
    id: 'sauces',
    title: 'Sauces on the side',
    subtitle: 'Add as many dips as you want',
    type: 'quantity',
    options: [
      { id: 'garlic', name: 'Garlic sauce', price: 15, maxQty: 5 },
      { id: 'bbq', name: 'BBQ', price: 15, maxQty: 5 },
      { id: 'ranch', name: 'Ranch', price: 15, maxQty: 5 },
      { id: 'spicy', name: 'Spicy sauce', price: 15, maxQty: 5 },
      { id: 'tomato', name: 'Tomato sauce', price: 10, maxQty: 5 },
    ],
  },
};

const PIZZA_OPTIONS = ['crust', 'cheese', 'toppings', 'sauces'];

/* ───────────── Categories ───────────── */

export const categories: Category[] = [
  { id: 'classic', name: 'Classic Pizzas', description: 'The favorites, done right.' },
  { id: 'chicken', name: 'Chicken Pizzas', description: 'Juicy chicken, signature sauces.' },
  { id: 'meat', name: 'Meat Pizzas', description: 'Loaded and generous.' },
  { id: 'specialty', name: 'Specialty Pizzas', description: 'Our signature creations.' },
  { id: 'vegetarian', name: 'Vegetarian', description: 'Fresh vegetables, real cheese.' },
  { id: 'extras', name: 'Extras', description: 'Sides, dips and drinks.' },
];

/* ───────────── Products (SAMPLE PRICES) ───────────── */

const pizzaPrices = (s: number, m: number, l: number, f: number) => ({ small: s, medium: m, large: l, family: f });

export const products: Product[] = [
  {
    id: 'margherita',
    categoryId: 'classic',
    name: 'Margherita',
    description: 'Tomato sauce, mozzarella and herbs.',
    image: 'menu/margherita',
    prices: pizzaPrices(110, 160, 210, 280),
    optionGroupIds: PIZZA_OPTIONS,
    tags: ['veg'],
    featured: true,
  },
  {
    id: 'cheese',
    categoryId: 'classic',
    name: 'Cheese',
    description: 'Extra cheesy classic pizza.',
    image: 'photos/cheese-pull',
    prices: pizzaPrices(120, 170, 225, 300),
    optionGroupIds: PIZZA_OPTIONS,
    tags: ['bestseller', 'veg'],
  },
  {
    id: 'pepperoni',
    categoryId: 'classic',
    name: 'Pepperoni',
    description: 'Pepperoni, mozzarella and tomato sauce.',
    image: 'menu/pepperoni',
    prices: pizzaPrices(135, 190, 250, 330),
    optionGroupIds: PIZZA_OPTIONS,
  },
  {
    id: 'build-your-own',
    categoryId: 'classic',
    name: 'Build Your Own',
    description: 'Start with tomato sauce and mozzarella, then add everything you love.',
    image: 'menu/extra-toppings',
    prices: pizzaPrices(100, 145, 195, 260),
    optionGroupIds: PIZZA_OPTIONS,
  },
  {
    id: 'chicken-ranch',
    categoryId: 'chicken',
    name: 'Chicken Ranch',
    description: 'Chicken, mozzarella and ranch-style sauce.',
    image: 'menu/chicken-ranch',
    prices: pizzaPrices(140, 200, 260, 345),
    optionGroupIds: PIZZA_OPTIONS,
    tags: ['bestseller'],
    featured: true,
  },
  {
    id: 'chicken-bbq',
    categoryId: 'chicken',
    name: 'Chicken BBQ',
    description: 'Chicken, mozzarella and BBQ sauce.',
    image: 'menu/chicken-bbq',
    prices: pizzaPrices(140, 200, 260, 345),
    optionGroupIds: PIZZA_OPTIONS,
    featured: true,
  },
  {
    id: 'sausage',
    categoryId: 'meat',
    name: 'Sausage',
    description: 'Egyptian sausage, mozzarella and signature sauce.',
    image: 'menu/sausage',
    prices: pizzaPrices(135, 190, 250, 330),
    optionGroupIds: PIZZA_OPTIONS,
    tags: ['spicy'],
    featured: true,
  },
  {
    id: 'mix-meat',
    categoryId: 'meat',
    name: 'Mix Meat',
    description: 'A loaded combination of selected meat toppings.',
    image: 'menu/mix-meat',
    prices: pizzaPrices(155, 220, 285, 375),
    optionGroupIds: PIZZA_OPTIONS,
    featured: true,
  },
  {
    id: 'pizza-hub-special',
    categoryId: 'specialty',
    name: 'Pizza Hub Special',
    description: 'Our signature loaded pizza — meats, vegetables and a serious amount of cheese.',
    image: 'menu/pizza-hub-special',
    prices: pizzaPrices(165, 235, 300, 395),
    optionGroupIds: PIZZA_OPTIONS,
    tags: ['signature'],
    featured: true,
  },
  {
    id: 'supreme',
    categoryId: 'specialty',
    name: 'Supreme',
    description: 'Pepperoni, sausage, peppers, onions, olives and mushrooms.',
    image: 'menu/cheese',
    prices: pizzaPrices(155, 220, 285, 375),
    optionGroupIds: PIZZA_OPTIONS,
  },
  {
    id: 'vegetarian',
    categoryId: 'vegetarian',
    name: 'Vegetarian',
    description: 'Peppers, onions, mushrooms, olives, tomatoes and mozzarella.',
    image: 'menu/vegetarian',
    prices: pizzaPrices(120, 175, 230, 305),
    optionGroupIds: PIZZA_OPTIONS,
    tags: ['veg'],
    featured: true,
  },
  {
    id: 'garlic-bread',
    categoryId: 'extras',
    name: 'Garlic Bread Sticks',
    description: 'Golden, buttery garlic sticks with a tomato dip.',
    image: 'menu/garlic-bread',
    prices: { regular: 60 },
    optionGroupIds: ['sauces'],
  },
  {
    id: 'dips',
    categoryId: 'extras',
    name: 'Dips',
    description: 'Garlic, BBQ, ranch, spicy or tomato — pick your favorites.',
    image: 'menu/dips',
    prices: { regular: 0 },
    optionGroupIds: ['sauces'],
  },
  {
    id: 'soft-drink',
    categoryId: 'extras',
    name: 'Soft Drink',
    description: 'Ice-cold soft drink.',
    image: 'menu/drinks',
    prices: { regular: 25 },
  },
];

/* ───────────── Helpers ───────────── */

export const productById = new Map(products.map((p) => [p.id, p]));

export function availableProducts(): Product[] {
  return products.filter((p) => p.available !== false);
}

export function productsInCategory(categoryId: string): Product[] {
  return availableProducts().filter((p) => p.categoryId === categoryId);
}

export function productSizes(product: Product): SizeId[] {
  return sizeOrder.filter((s) => typeof product.prices[s] === 'number');
}

export function productOptionGroups(product: Product): OptionGroup[] {
  return (product.optionGroupIds ?? []).map((id) => optionGroups[id]).filter(Boolean);
}

export function isCustomizable(product: Product): boolean {
  return productSizes(product).length > 1 || productOptionGroups(product).length > 0;
}
