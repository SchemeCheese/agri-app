import { Platform } from 'react-native';

/**
 * Platform-aware storage for Zustand persist middleware
 * Uses AsyncStorage on native, localStorage on web
 */

interface Storage {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void>;
  removeItem: (name: string) => void | Promise<void>;
}

let storage: Storage;

if (Platform.OS === 'web') {
  // Web environment - use localStorage
  storage = {
    getItem: (name: string) => {
      try {
        return typeof window !== 'undefined' ? window.localStorage.getItem(name) : null;
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(name, value);
        }
      } catch {
        // Silently fail
      }
    },
    removeItem: (name: string) => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(name);
        }
      } catch {
        // Silently fail
      }
    },
  };
} else {
  // Native environment - use AsyncStorage
  // Lazy load to avoid issues on web
  let asyncStorageModule: any = null;

  storage = {
    getItem: async (name: string) => {
      try {
        if (!asyncStorageModule) {
          asyncStorageModule = await import('@react-native-async-storage/async-storage');
        }
        return await asyncStorageModule.default.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: async (name: string, value: string) => {
      try {
        if (!asyncStorageModule) {
          asyncStorageModule = await import('@react-native-async-storage/async-storage');
        }
        await asyncStorageModule.default.setItem(name, value);
      } catch {
        // Silently fail
      }
    },
    removeItem: async (name: string) => {
      try {
        if (!asyncStorageModule) {
          asyncStorageModule = await import('@react-native-async-storage/async-storage');
        }
        await asyncStorageModule.default.removeItem(name);
      } catch {
        // Silently fail
      }
    },
  };
}

export default storage;
