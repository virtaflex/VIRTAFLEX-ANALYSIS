import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { site } from './src/config/site.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Builds schema.org Restaurant data from site.ts — only includes fields that are filled in. */
function localBusiness() {
  const { address, contact, links, hours } = site;
  const days: Record<string, string[]> = {
    daily: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  };
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: site.name,
    slogan: site.tagline,
    url: site.url,
    image: `${site.url}${site.seo.ogImage}`,
    logo: `${site.url}/images/brand/logo-full-600.png`,
    servesCuisine: ['Pizza', 'Egyptian'],
    priceRange: 'EGP',
    hasMenu: `${site.url}/menu`,
    acceptsReservations: false,
    address: {
      '@type': 'PostalAddress',
      ...(address.street && { streetAddress: address.street }),
      addressLocality: address.city,
      addressRegion: address.region,
      addressCountry: address.countryCode,
    },
  };
  if (address.geo) data.geo = { '@type': 'GeoCoordinates', latitude: address.geo.lat, longitude: address.geo.lng };
  if (contact.phone) data.telephone = contact.phone;
  const sameAs = [links.instagram, links.facebook, links.tiktok, links.talabat].filter(Boolean);
  if (sameAs.length) data.sameAs = sameAs;
  if (hours.length) {
    data.openingHoursSpecification = hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: days[h.days.toLowerCase()] ?? h.days,
      opens: h.opens,
      closes: h.closes,
    }));
  }
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function seo(): Plugin {
  return {
    name: 'pizzahub-seo',
    transformIndexHtml(html) {
      return html
        .replaceAll('%SEO_TITLE%', esc(site.seo.title))
        .replaceAll('%SEO_DESCRIPTION%', esc(site.seo.description))
        .replaceAll('%SITE_NAME%', esc(site.name))
        .replaceAll('%SITE_URL%', site.url.replace(/\/$/, ''))
        .replaceAll('%OG_IMAGE%', site.seo.ogImage)
        .replace('<!--LOCAL_BUSINESS_JSONLD-->', `<script type="application/ld+json">${localBusiness()}</script>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), seo()],
  server: {
    // `npm run dev` + `npm run dev:server` → API calls are proxied to the order server
    proxy: { '/api': 'http://localhost:8080' },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    assetsInlineLimit: 2048,
  },
});
