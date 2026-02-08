// LocalStorage Adapter - Browser localStorage implementation
import type { StorageAdapter } from './types';

/**
 * localStorage-based storage adapter
 * Used during development and for client-side caching
 */
export class LocalStorageAdapter implements StorageAdapter {
  private isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;
    
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`[LocalStorageAdapter] Error reading key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('[LocalStorageAdapter] localStorage not available');
      return;
    }
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[LocalStorageAdapter] Error writing key "${key}":`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    if (!this.isAvailable()) return;
    window.localStorage.removeItem(key);
  }

  async has(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    return window.localStorage.getItem(key) !== null;
  }

  async clear(): Promise<void> {
    if (!this.isAvailable()) return;
    window.localStorage.clear();
  }
}

// Singleton instance for easy import
export const localStorageAdapter = new LocalStorageAdapter();
