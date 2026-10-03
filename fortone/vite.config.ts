import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { site } from './src/config/site.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Fills SEO placeholders in index.html from src/config/site.ts. */
function seo(): Plugin {
  return {
    name: 'fortone-seo',
    transformIndexHtml(html) {
      const ld = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'IceCreamShop',
        name: site.fullName,
        slogan: site.tagline,
        url: site.url,
        image: `${site.url}/media/og.jpg`,
        hasMap: site.locations[0]?.mapsUrl,
        ...(site.contact.phone && { telephone: site.contact.phone }),
      }).replace(/</g, '\\u003c');
      return html
        .replaceAll('%SEO_TITLE%', esc(site.seo.title))
        .replaceAll('%SEO_DESCRIPTION%', esc(site.seo.description))
        .replaceAll('%SITE_NAME%', esc(site.fullName))
        .replace('<!--JSONLD-->', `<script type="application/ld+json">${ld}</script>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), seo()],
  build: { target: 'es2020', assetsInlineLimit: 2048 },
});
