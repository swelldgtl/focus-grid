/**
 * Utilities for localStorage data persistence
 */

const STORAGE_KEYS = {
  GOALS_DATA: "focus_grid_goals",
  ACTION_ITEMS: "focus_grid_actions",
  BLOCKERS: "focus_grid_blockers",
  AGENDA_ITEMS: "focus_grid_agenda",
  TIME_HEADERS: "focus_grid_time_headers",
  LONG_TERM_GOALS: "focus_grid_long_term_goals",
  APP_DATA: "focus_grid_app_data",
} as const;

/**
 * Safely get data from localStorage with error handling
 */
export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    const stored = localStorage.getItem(key);
    if (stored === null) {
      return defaultValue;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.warn(`Failed to parse stored data for key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely set data to localStorage with error handling
 */
export function setStoredData<T>(key: string, value: T): void {
  try {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to store data for key "${key}":`, error);
  }
}

/**
 * Remove data from localStorage
 */
export function removeStoredData(key: string): void {
  try {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove stored data for key "${key}":`, error);
  }
}

/**
 * Clear all Focus Grid data from localStorage
 */
export function clearAllStoredData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    removeStoredData(key);
  });
}

/**
 * Export all Focus Grid data for backup
 */
export function exportAllData(): string {
  const allData: Record<string, any> = {};

  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        allData[name] = JSON.parse(data);
      }
    } catch (error) {
      console.warn(`Failed to export data for ${name}:`, error);
    }
  });

  return JSON.stringify(allData, null, 2);
}

/**
 * Import Focus Grid data from backup
 */
export function importAllData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);

    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (data[name]) {
        setStoredData(key, data[name]);
      }
    });

    return true;
  } catch (error) {
    console.error("Failed to import data:", error);
    return false;
  }
}

export { STORAGE_KEYS };
