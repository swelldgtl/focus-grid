import { useState, useEffect, useCallback } from "react";
import { getStoredData, setStoredData } from "@/lib/storage";

/**
 * Custom hook that syncs state with localStorage
 * Automatically saves state changes and loads initial data from localStorage
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options: {
    /**
     * Debounce delay in milliseconds to prevent excessive localStorage writes
     * Default: 500ms
     */
    debounceMs?: number;
    /**
     * Custom serializer for complex objects
     */
    serialize?: (value: T) => string;
    /**
     * Custom deserializer for complex objects
     */
    deserialize?: (value: string) => T;
  } = {},
): [
  T,
  React.Dispatch<React.SetStateAction<T>>,
  { clear: () => void; export: () => string },
] {
  const { debounceMs = 500, serialize, deserialize } = options;

  // Initialize state with stored data or default value
  const [state, setState] = useState<T>(() => {
    // Check if we're on the client side
    if (typeof window === "undefined") {
      return defaultValue;
    }

    if (deserialize) {
      try {
        const stored = localStorage.getItem(key);
        return stored ? deserialize(stored) : defaultValue;
      } catch {
        return defaultValue;
      }
    }
    return getStoredData(key, defaultValue);
  });

  // Debounced localStorage update
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (serialize) {
        try {
          localStorage.setItem(key, serialize(state));
        } catch (error) {
          console.warn(
            `Failed to serialize and store data for key "${key}":`,
            error,
          );
        }
      } else {
        setStoredData(key, state);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [state, key, debounceMs, serialize]);

  // Utility functions
  const clear = useCallback(() => {
    setState(defaultValue);
    localStorage.removeItem(key);
  }, [key, defaultValue]);

  const exportData = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  return [state, setState, { clear, export: exportData }];
}

/**
 * Hook specifically for arrays with common array operations
 */
export function usePersistentArray<T>(
  key: string,
  defaultValue: T[] = [],
): [
  T[],
  {
    set: React.Dispatch<React.SetStateAction<T[]>>;
    add: (item: T) => void;
    remove: (predicate: (item: T) => boolean) => void;
    update: (predicate: (item: T) => boolean, updater: (item: T) => T) => void;
    clear: () => void;
    reorder: (fromIndex: number, toIndex: number) => void;
  },
] {
  const [array, setArray] = usePersistentState(key, defaultValue);

  const add = useCallback(
    (item: T) => {
      setArray((prev) => [...prev, item]);
    },
    [setArray],
  );

  const remove = useCallback(
    (predicate: (item: T) => boolean) => {
      setArray((prev) => prev.filter((item) => !predicate(item)));
    },
    [setArray],
  );

  const update = useCallback(
    (predicate: (item: T) => boolean, updater: (item: T) => T) => {
      setArray((prev) =>
        prev.map((item) => (predicate(item) ? updater(item) : item)),
      );
    },
    [setArray],
  );

  const clear = useCallback(() => {
    setArray([]);
  }, [setArray]);

  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      setArray((prev) => {
        const newArray = [...prev];
        const [removed] = newArray.splice(fromIndex, 1);
        newArray.splice(toIndex, 0, removed);
        return newArray;
      });
    },
    [setArray],
  );

  return [
    array,
    {
      set: setArray,
      add,
      remove,
      update,
      clear,
      reorder,
    },
  ];
}
