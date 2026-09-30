import { useEffect } from 'react';

export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title
      ? `${title} · LEKHA`
      : 'LEKHA — GST invoices for Indian businesses.';

    if (!description) return undefined;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
    }
    const previous = tag.getAttribute('content');
    tag.setAttribute('content', description);
    return () => {
      if (previous) tag.setAttribute('content', previous);
    };
  }, [title, description]);
}
