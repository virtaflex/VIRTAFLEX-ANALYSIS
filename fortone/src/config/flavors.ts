export type Category = 'classic' | 'fruity' | 'signature';

export interface Flavor {
  id: string;
  name: string;
  category: Category;
  /** one-line tasting note shown on cards */
  notes: string;
  description: string;
  /** render in public/media: flavor-<image>-480.webp / -900.webp */
  image: string;
  serve: 'Cone' | 'Cup';
  /** card background + accent (kept pastel so the renders pop) */
  tint: string;
  accent: string;
  toppings: string[];
  /** EGP — leave undefined to hide the price */
  price?: number;
}

export const categories: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'All flavours' },
  { id: 'classic', label: 'Classics' },
  { id: 'signature', label: 'Signatures' },
  { id: 'fruity', label: 'Fruity' },
];

export const flavors: Flavor[] = [
  {
    id: 'vanilla',
    name: 'Madagascar Vanilla',
    category: 'classic',
    notes: 'Velvety · floral · clean finish',
    description: 'The swirl that started it all. Real vanilla bean, slow-churned until it turns to silk, finished with a shower of pastel sprinkles.',
    image: 'vanilla',
    serve: 'Cone',
    tint: '#fbf1e2',
    accent: '#c9a15b',
    toppings: ['Rainbow sprinkles'],
  },
  {
    id: 'chocolate',
    name: 'Double Dark Chocolate',
    category: 'classic',
    notes: 'Deep cocoa · ganache · biscuit',
    description: 'Dark cocoa soft serve wrapped in a glossy ganache ribbon and toasted biscuit crumb. Rich without being heavy.',
    image: 'chocolate',
    serve: 'Cone',
    tint: '#ead8cc',
    accent: '#6b3a26',
    toppings: ['Ganache drizzle', 'Biscuit crumb'],
  },
  {
    id: 'twist',
    name: 'The Fortone Twist',
    category: 'signature',
    notes: 'Vanilla × chocolate · the house icon',
    description: 'Two swirls, one cone. Vanilla and dark chocolate pulled together through our star nozzle — the one everyone photographs.',
    image: 'twist',
    serve: 'Cone',
    tint: '#f1e2d6',
    accent: '#3a1520',
    toppings: [],
  },
  {
    id: 'strawberry',
    name: 'Strawberry Bloom',
    category: 'fruity',
    notes: 'Bright berry · ripple · sprinkles',
    description: 'Fresh strawberry soft serve with a ruby berry ripple and a crown of sprinkles. Tastes like the first warm day of summer.',
    image: 'strawberry',
    serve: 'Cone',
    tint: '#fde3e8',
    accent: '#c2304f',
    toppings: ['Berry ripple', 'Sprinkles'],
  },
  {
    id: 'pistachio',
    name: 'Pistachio Royale',
    category: 'signature',
    notes: 'Roasted nut · buttery · crushed pistachio',
    description: 'Roasted pistachio cream swirled high in our signature cup and finished with hand-crushed pistachios.',
    image: 'pistachio',
    serve: 'Cup',
    tint: '#e8f0d4',
    accent: '#6f8f3c',
    toppings: ['Crushed pistachio'],
  },
  {
    id: 'mango',
    name: 'Mango & Cream',
    category: 'fruity',
    notes: 'Sun-ripe mango · fresh cubes',
    description: 'Mango and sweet cream swirled together and topped with fresh mango cubes. Bright, juicy, made for Egyptian summers.',
    image: 'mango',
    serve: 'Cup',
    tint: '#fff0cc',
    accent: '#e08a12',
    toppings: ['Fresh mango cubes'],
  },
  {
    id: 'caramel',
    name: 'Salted Caramel Crunch',
    category: 'signature',
    notes: 'Burnt sugar · sea salt · crunch',
    description: 'Caramel soft serve with a glassy salted-caramel drizzle and buttery biscuit crunch. Sweet, salty, dangerous.',
    image: 'caramel',
    serve: 'Cone',
    tint: '#f6e4c9',
    accent: '#b86a1c',
    toppings: ['Salted caramel', 'Biscuit crunch'],
  },
  {
    id: 'hazelnut',
    name: 'Hazelnut Praline',
    category: 'signature',
    notes: 'Toasted hazelnut · praline · cocoa',
    description: 'Hazelnut and vanilla twist with cocoa drizzle and praline crumble, layered high in a cup.',
    image: 'hazelnut',
    serve: 'Cup',
    tint: '#ecdccd',
    accent: '#4a2414',
    toppings: ['Cocoa drizzle', 'Praline crumble'],
  },
];

/** "Also on the counter" — items without renders. */
export const extras = [
  { name: 'Thick Shakes', detail: 'Any flavour, blended to order' },
  { name: 'Sundae Cups', detail: 'Two swirls, three toppings, all the sauce' },
  { name: 'Affogato', detail: 'Vanilla swirl drowned in hot espresso' },
  { name: 'Take-home Tubs', detail: 'Your favourite, packed for the freezer' },
];
