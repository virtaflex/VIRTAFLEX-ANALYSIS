import { useEffect } from 'react';
import { site } from '../config/site.ts';

/** Public file URL that works under any base path (hash build hosted in a sub-folder). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export const flavorImg = (image: string, w: 480 | 900) => asset(`media/flavor-${image}-${w}.webp`);

export function useDocumentMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${site.fullName}` : site.seo.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description ?? site.seo.description);
  }, [title, description]);
}
