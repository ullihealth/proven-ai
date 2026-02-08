// D1 Adapter Stub - Placeholder for Cloudflare D1 implementation
// This file will be replaced with real D1 logic after migration

import type { StorageAdapter } from './types';

/**
 * Stub D1 adapter - throws errors to catch accidental usage before migration
 * 
 * After connecting to Cloudflare:
 * 1. Replace this with real D1 client initialization
 * 2. Implement actual SQL queries for each method
 * 3. Update the factory in index.ts to use the real adapter
 */
export class D1AdapterStub implements StorageAdapter {
  private throwNotImplemented(method: string): never {
    throw new Error(
      `[D1AdapterStub] ${method}() not implemented. ` +
      `Connect to Cloudflare D1 and replace this stub with a real implementation.`
    );
  }

  async get<T>(_key: string): Promise<T | null> {
    this.throwNotImplemented('get');
  }

  async set<T>(_key: string, _value: T): Promise<void> {
    this.throwNotImplemented('set');
  }

  async remove(_key: string): Promise<void> {
    this.throwNotImplemented('remove');
  }

  async has(_key: string): Promise<boolean> {
    this.throwNotImplemented('has');
  }

  async clear(): Promise<void> {
    this.throwNotImplemented('clear');
  }
}

// Export for type checking and future replacement
export const d1AdapterStub = new D1AdapterStub();
