import { useState, useCallback } from 'react';

export function useGeolocation() {
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const solicitar = useCallback(() => {
    if (!navigator.geolocation) {
      setError('El navegador no soporta geolocalización');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setError('No se pudo obtener la ubicación');
        setLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  return { coords, error, loading, solicitar };
}
