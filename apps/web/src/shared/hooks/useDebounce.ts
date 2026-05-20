import { useEffect, useState } from 'react';

// Generic debounce hook. Used by the search box on the board view to avoid
// firing a query on every keystroke.
export function useDebounce<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
