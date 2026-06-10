import { useState, useCallback } from 'react';

export function useGeolocation() {
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const solicitar = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.code === err.PERMISSION_DENIED
          ? 'Permiso de ubicación denegado — actívalo en la barra del navegador'
          : 'No se pudo obtener tu ubicación, intenta de nuevo');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return { coords, error, loading, solicitar };
}
