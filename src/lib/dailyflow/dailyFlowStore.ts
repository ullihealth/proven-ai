/**
 * Daily Flow Store — D1-backed via /api/daily-flow + /api/admin/daily-flow
 * In-memory cache: loadDailyFlowData() fetches once, getAllPosts()/etc. read cache.
 * Visual settings stored in app_visual_config key "dailyflow_visual_settings".
 */
import { 
  DailyFlowPost, 
  DayOfWeek, 
  DailyFlowVisualSettings, 
  defaultDailyFlowVisualSettings 
} from './types';

// ---- In-memory cache ----
let postsCache: DailyFlowPost[] = [];
let visualSettingsCache: Partial<Record<DayOfWeek, DailyFlowVisualSettings>> = {};
let cacheLoaded = false;

const VISUAL_SETTINGS_KEY = 'dailyflow_visual_settings';

/** Load all posts + visual settings from D1 — call once on app init */
export async function loadDailyFlowData(): Promise<void> {
  if (cacheLoaded) return;
  try {
    // Load all posts (admin endpoint returns drafts too; public returns published only)
    // Try admin first — if not admin, fall back to public
    let res = await fetch('/api/admin/daily-flow', { credentials: 'include' });
    if (!res.ok) {
      res = await fetch('/api/daily-flow');
    }
    if (res.ok) {
      const json = await res.json() as { ok: boolean; posts: DailyFlowPost[] };
      if (json.ok) postsCache = json.posts || [];
    }
  } catch (err) {
    console.error('[dailyFlowStore] load posts failed:', err);
  }

  // Load visual settings from app_visual_config
  try {
    const res = await fetch(`/api/visual-config?key=${VISUAL_SETTINGS_KEY}`);
    if (res.ok) {
      const json = await res.json() as { ok: boolean; value: Partial<Record<DayOfWeek, DailyFlowVisualSettings>> | null };
      if (json.ok && json.value) {
        visualSettingsCache = json.value;
      }
    }
  } catch (err) {
    console.error('[dailyFlowStore] load visual settings failed:', err);
  }

  cacheLoaded = true;
}

// Generate unique ID
const generateId = (): string => {
  return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get all posts from cache
export const getAllPosts = (): DailyFlowPost[] => {
  return postsCache;
};

// Get posts for a specific day
export const getPostsByDay = (day: DayOfWeek): DailyFlowPost[] => {
  return postsCache.filter(post => post.day === day);
};

// Get all published posts for a specific day (sorted newest first)
export const getPublishedPostsForDay = (day: DayOfWeek): DailyFlowPost[] => {
  return postsCache
    .filter(post => post.day === day && post.status === 'published')
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });
};

// Get the most recent published post for a specific day
export const getPublishedPostForDay = (day: DayOfWeek): DailyFlowPost | null => {
  const posts = getPublishedPostsForDay(day);
  return posts.length > 0 ? posts[0] : null;
};

// Get a specific post by ID
export const getPostById = (id: string): DailyFlowPost | null => {
  return postsCache.find(post => post.id === id) || null;
};

// Create a new post
export const createPost = async (
  postData: Omit<DailyFlowPost, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DailyFlowPost> => {
  const now = new Date().toISOString();
  const newPost: DailyFlowPost = {
    ...postData,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  try {
    await fetch('/api/admin/daily-flow', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost),
    });
  } catch (err) {
    console.error('[dailyFlowStore] createPost failed:', err);
  }

  postsCache.push(newPost);
  return newPost;
};

// Update an existing post
export const updatePost = async (
  id: string,
  updates: Partial<Omit<DailyFlowPost, 'id' | 'createdAt'>>
): Promise<DailyFlowPost | null> => {
  const index = postsCache.findIndex(post => post.id === id);
  if (index === -1) return null;

  postsCache[index] = {
    ...postsCache[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    await fetch('/api/admin/daily-flow', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postsCache[index]),
    });
  } catch (err) {
    console.error('[dailyFlowStore] updatePost failed:', err);
  }

  return postsCache[index];
};

// Save post (create or update)
export const savePost = async (
  post: Partial<DailyFlowPost> & { day: DayOfWeek; title: string; description: string; videoType: 'upload' | 'url'; videoUrl: string; status: 'draft' | 'published' }
): Promise<DailyFlowPost> => {
  if (post.id) {
    const updated = await updatePost(post.id, post);
    if (updated) return updated;
  }
  return createPost(post as Omit<DailyFlowPost, 'id' | 'createdAt' | 'updatedAt'>);
};

// Delete a post
export const deletePost = async (id: string): Promise<boolean> => {
  const before = postsCache.length;
  postsCache = postsCache.filter(post => post.id !== id);
  if (postsCache.length === before) return false;

  try {
    await fetch(`/api/admin/daily-flow?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  } catch (err) {
    console.error('[dailyFlowStore] deletePost failed:', err);
  }

  return true;
};

// Publish a post
export const publishPost = async (id: string): Promise<DailyFlowPost | null> => {
  const index = postsCache.findIndex(post => post.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  postsCache[index] = {
    ...postsCache[index],
    status: 'published',
    publishedAt: now,
    updatedAt: now,
  };

  try {
    await fetch('/api/admin/daily-flow', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'publish' }),
    });
  } catch (err) {
    console.error('[dailyFlowStore] publishPost failed:', err);
  }

  return postsCache[index];
};

// Unpublish a post
export const unpublishPost = async (id: string): Promise<DailyFlowPost | null> => {
  const index = postsCache.findIndex(post => post.id === id);
  if (index === -1) return null;

  postsCache[index] = {
    ...postsCache[index],
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };

  try {
    await fetch('/api/admin/daily-flow', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'unpublish' }),
    });
  } catch (err) {
    console.error('[dailyFlowStore] unpublishPost failed:', err);
  }

  return postsCache[index];
};

// Get visual settings for a day (sync from cache)
export const getDayVisualSettings = (day: DayOfWeek): DailyFlowVisualSettings => {
  return visualSettingsCache[day] || defaultDailyFlowVisualSettings;
};

// Save visual settings for a day
export const saveDayVisualSettings = async (day: DayOfWeek, settings: DailyFlowVisualSettings): Promise<void> => {
  visualSettingsCache[day] = settings;
  try {
    await fetch('/api/admin/visual-config', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: VISUAL_SETTINGS_KEY, value: visualSettingsCache }),
    });
  } catch (err) {
    console.error('[dailyFlowStore] saveDayVisualSettings failed:', err);
  }
};

// Get all visual settings (sync from cache)
export const getAllVisualSettings = (): Partial<Record<DayOfWeek, DailyFlowVisualSettings>> => {
  return visualSettingsCache;
};

// Get drafts for a specific day
export const getDraftsForDay = (day: DayOfWeek): DailyFlowPost[] => {
  return postsCache.filter(post => post.day === day && post.status === 'draft');
};
