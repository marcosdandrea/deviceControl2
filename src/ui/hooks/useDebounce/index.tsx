import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 * @param value Valor a hacer debounce
 * @param delay Tiempo de espera en ms
 * @returns Valor con debounce aplicado
 */
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;