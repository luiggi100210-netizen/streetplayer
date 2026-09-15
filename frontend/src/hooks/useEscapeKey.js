import { useEffect } from 'react';

/** Cierra un modal/overlay al presionar Escape (accesibilidad de teclado). */
export function useEscapeKey(onEscape) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onEscape(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onEscape]);
}
