import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';

export function useSocket() {
  const ref = useRef(null);

  useEffect(() => {
    ref.current = getSocket();
    return () => {};
  }, []);

  return ref.current ?? getSocket();
}
