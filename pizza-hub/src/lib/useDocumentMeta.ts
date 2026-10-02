import { useEffect } from 'react';
import { site } from '../config/site.ts';

/** Per-page <title> and meta description. */
export function useDocumentMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${site.name}` : site.seo.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description ?? site.seo.description);
  }, [title, description]);
}
