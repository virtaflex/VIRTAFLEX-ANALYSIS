/**
 * Everything the business edits lives here and in flavors.ts.
 * Empty strings are hidden on the site, so leave a field blank rather than guessing.
 */
export interface Location {
  name: string;
  area: string;
  address: string;
  mapsUrl: string;
  /** e.g. [{ days: 'Daily', time: '12:00 PM – 2:00 AM' }] — leave empty to show "see Google Maps" */
  hours: { days: string; time: string }[];
}

export const site = {
  name: 'Fortone',
  fullName: 'Fortone Ice Cream',
  tagline: 'Swirled slow. Served cold.',
  // TODO: replace with the live domain once it's connected
  url: 'https://fortone.example',

  contact: {
    // TODO: fill in — blank values are hidden
    phone: '',
    /** international format without "+", e.g. 201001234567 */
    whatsapp: '',
    email: '',
  },

  social: {
    instagram: '',
    tiktok: '',
    facebook: '',
  },

  locations: <Location[]>[
    {
      name: 'Fortone Flagship',
      area: 'Egypt',
      address: '',
      mapsUrl: 'https://maps.app.goo.gl/hefnLmjPwzNPt6jJ8',
      hours: [],
    },
  ],

  seo: {
    title: 'Fortone Ice Cream — Swirled slow. Served cold.',
    description: 'Fortone is a premium soft-serve ice cream house. Silky swirls, real ingredients and signature flavours, hand-finished to order.',
  },
};

export const whatsappLink = (text: string) =>
  site.contact.whatsapp ? `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(text)}` : '';
