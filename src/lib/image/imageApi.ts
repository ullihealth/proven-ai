/**
 * Client-side helper for the server-side image API.
 *
 * Images are compressed client-side (via compressImage.ts) then stored
 * in D1 via /api/images.  Components reference images by URL:
 *   /api/images/{key}
 *
 * This replaces in-localStorage base64 blobs.
 */

import { compressImageFile, type CompressOptions } from "./compressImage";

/** Build the public URL for a stored image key */
export function imageUrl(key: string): string {
  return `/api/images/${encodeURIComponent(key)}`;
}

/**
 * Upload a File to the server image store.
 *
 * 1. Compresses the image client-side (canvas resize → JPEG).
 * 2. POSTs the data-URL to /api/images.
 * 3. Returns the URL path on success, or null on failure.
 */
export async function uploadImage(
  key: string,
  file: File,
  opts?: CompressOptions,
): Promise<string | null> {
  const compressed = await compressImageFile(file, opts);
  if (!compressed) return null;

  try {
    const res = await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, data: compressed }),
    });
    if (!res.ok) {
      console.error("[uploadImage] Server returned", res.status);
      return null;
    }
    // Return the public URL — append a cache-buster so the browser
    // refetches after an update
    return `${imageUrl(key)}?t=${Date.now()}`;
  } catch (err) {
    console.error("[uploadImage] Network error:", err);
    return null;
  }
}

/**
 * Delete an image from the server store.
 */
export async function deleteImage(key: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/images/${encodeURIComponent(key)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.error("[deleteImage] Network error:", err);
    return false;
  }
}
