import { useEffect } from 'react';

/**
 * Custom hook to dynamically manage document title and meta description per route.
 *
 * @param {string} title - The page title (e.g. "Campus Marketplace")
 * @param {string} [description] - Optional meta description for the page
 */
export function usePageTitle(title, description) {
  useEffect(() => {
    const baseTitle = 'CampusExchange — Verified College Student Marketplace & PYQ Library';
    document.title = title ? `${title} | CampusExchange` : baseTitle;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
  }, [title, description]);
}
