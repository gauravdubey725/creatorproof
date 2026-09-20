import { useState, useEffect, useCallback } from 'react';
import { loadState, saveState } from '../utils/storage';

/**
 * Custom hook to manage state synchronized with localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (valOrFn: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return loadState<T>(key, initialValue);
  });

  const setValue = useCallback((valOrFn: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const valueToStore = valOrFn instanceof Function ? valOrFn(prev) : valOrFn;
      saveState(key, valueToStore);
      return valueToStore;
    });
  }, [key]);

  // Keep in sync if another tab/window changes localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          // ignore parsing error
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
