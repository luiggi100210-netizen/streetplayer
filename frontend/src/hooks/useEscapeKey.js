import { useEffect, useRef } from 'react';

/** Cierra un modal/overlay al presionar Escape (accesibilidad de teclado). */
export function useEscapeKey(onEscape) {
  // La mayoria de los llamadores pasan una arrow function inline (referencia
  // nueva en cada render); leerla desde una ref evita reinstalar el listener
  // en cada render mientras se sigue llamando siempre a la version mas
  // reciente de onEscape.
  const callbackRef = useRef(onEscape);
  callbackRef.current = onEscape;

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') callbackRef.current(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
