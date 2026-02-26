import { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  sanitize?: (loaded: T) => T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const stored = loadFromStorage<T>(key);
    if (stored === null) return defaultValue;
    return sanitize ? sanitize(stored) : stored;
  });

  useEffect(() => {
    saveToStorage(key, state);
  }, [key, state]);

  return [state, setState];
}
