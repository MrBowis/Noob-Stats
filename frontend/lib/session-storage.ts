import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Web no tiene módulo nativo de SecureStore; usamos memoria como fallback.
// La app es mobile-first, así que la no-persistencia en web es aceptable.
const webStore: Record<string, string> = {};

export const SESSION_KEY = 'noobstats_session';

export const sessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return webStore[key] ?? null;
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      webStore[key] = value;
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      delete webStore[key];
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
