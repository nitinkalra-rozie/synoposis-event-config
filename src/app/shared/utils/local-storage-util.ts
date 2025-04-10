/**
 * Set an item in local storage
 * @param key The key under which the value is stored
 * @param value The value to store
 */
export const setLocalStorageItem = <T>(key: string, value: T): void => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('Error setting item in local storage', error);
  }
};

/**
 * Get an item from local storage
 * @param key The key of the item to retrieve
 * @returns The retrieved value, or null if the item does not exist
 */
export const getLocalStorageItem = <T>(key: string): T | null => {
  try {
    const serializedValue = localStorage.getItem(key);
    if (serializedValue === null) {
      return null;
    }
    return JSON.parse(serializedValue) as T;
  } catch (error) {
    console.error('Error getting item from local storage', error);
    return null;
  }
};

/**
 * Remove an item from local storage
 * @param key The key of the item to remove
 */
export const removeLocalStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing item from local storage', error);
  }
};

/**
 * Clear all items from local storage
 */
export const clearLocalStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing local storage', error);
  }
};
