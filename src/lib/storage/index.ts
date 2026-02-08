// Storage Module - Centralized storage abstraction
// Provides a single point of configuration for data persistence

export * from './types';
export * from './localStorageAdapter';
export { D1AdapterStub } from './d1Adapter.stub';

import type { StorageAdapter } from './types';
import { localStorageAdapter } from './localStorageAdapter';

/**
 * Get the current storage adapter
 * 
 * During development: returns localStorage adapter
 * After Cloudflare migration: will return D1 adapter
 * 
 * Usage:
 * ```ts
 * import { getStorageAdapter } from '@/lib/storage';
 * const storage = getStorageAdapter();
 * const data = await storage.get('my-key');
 * ```
 */
export function getStorageAdapter(): StorageAdapter {
  // TODO: After Cloudflare migration, check environment and return D1 adapter
  // if (import.meta.env.VITE_USE_D1 === 'true') {
  //   return d1Adapter;
  // }
  
  return localStorageAdapter;
}

/**
 * Convenience function for synchronous localStorage access
 * Use only when async is not feasible (rare cases)
 * 
 * @deprecated Prefer getStorageAdapter() for future compatibility
 */
export function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}
