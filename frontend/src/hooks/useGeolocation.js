import { useState, useCallback, useEffect, useRef } from 'react';

export function useGeolocation() {
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);
  const montado = useRef(true);
  useEffect(() => () => { montado.current = false; }, []);

  const solicitar = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!montado.current) return;
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        if (!montado.current) return;
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
