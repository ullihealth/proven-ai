/**
 * User Preferences Store — D1-backed per-user key-value storage.
 *
 * loadUserPreferences() fetches all prefs for the logged-in user.
 * getUserPreference(key) returns cached value synchronously.
 * saveUserPreference(key, value) writes to D1 + updates cache.
 */

let prefsCache: Record<string, unknown> = {};
let cacheLoaded = false;

/** Load all preferences for the current user from D1 */
export async function loadUserPreferences(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const res = await fetch("/api/user-preferences", { credentials: "include" });
    if (res.ok) {
      const json = (await res.json()) as { ok: boolean; preferences?: Record<string, unknown> };
      if (json.ok && json.preferences) {
        prefsCache = json.preferences;
      }
    }
  } catch (err) {
    console.error("[userPreferences] load failed:", err);
  }
  cacheLoaded = true;
}

/** Sync read from cache */
export function getUserPreference<T = unknown>(key: string): T | null {
  return (prefsCache[key] as T) ?? null;
}

/** Save a preference to D1 + update cache */
export async function saveUserPreference(key: string, value: unknown): Promise<void> {
  prefsCache[key] = value;
  try {
    await fetch("/api/user-preferences", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  } catch (err) {
    console.error("[userPreferences] save failed:", err);
  }
}

/** Check if preferences have been loaded */
export function isUserPreferencesLoaded(): boolean {
  return cacheLoaded;
}
