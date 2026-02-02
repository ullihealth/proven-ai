// Daily Flow Store - localStorage persistence
import { 
  DailyFlowPost, 
  DayOfWeek, 
  DailyFlowVisualSettings, 
  defaultDailyFlowVisualSettings 
} from './types';

const POSTS_STORAGE_KEY = 'provenai_dailyflow_posts';
const VISUAL_SETTINGS_STORAGE_KEY = 'provenai_dailyflow_visual_settings';

// Generate unique ID
const generateId = (): string => {
  return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get all posts from localStorage
export const getAllPosts = (): DailyFlowPost[] => {
  try {
    const stored = localStorage.getItem(POSTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    console.error('Failed to load daily flow posts');
    return [];
  }
};

// Save all posts to localStorage
const savePosts = (posts: DailyFlowPost[]): void => {
  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    console.error('Failed to save daily flow posts', error);
  }
};

// Get posts for a specific day
export const getPostsByDay = (day: DayOfWeek): DailyFlowPost[] => {
  return getAllPosts().filter(post => post.day === day);
};

// Get the published post for a specific day (only one can be published)
export const getPublishedPostForDay = (day: DayOfWeek): DailyFlowPost | null => {
  const posts = getAllPosts();
  return posts.find(post => post.day === day && post.status === 'published') || null;
};

// Get a specific post by ID
export const getPostById = (id: string): DailyFlowPost | null => {
  const posts = getAllPosts();
  return posts.find(post => post.id === id) || null;
};

// Create a new post
export const createPost = (postData: Omit<DailyFlowPost, 'id' | 'createdAt' | 'updatedAt'>): DailyFlowPost => {
  const now = new Date().toISOString();
  const newPost: DailyFlowPost = {
    ...postData,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  
  const posts = getAllPosts();
  posts.push(newPost);
  savePosts(posts);
  
  return newPost;
};

// Update an existing post
export const updatePost = (id: string, updates: Partial<Omit<DailyFlowPost, 'id' | 'createdAt'>>): DailyFlowPost | null => {
  const posts = getAllPosts();
  const index = posts.findIndex(post => post.id === id);
  
  if (index === -1) return null;
  
  posts[index] = {
    ...posts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  savePosts(posts);
  return posts[index];
};

// Save post (create or update)
export const savePost = (post: Partial<DailyFlowPost> & { day: DayOfWeek; title: string; description: string; videoType: 'upload' | 'url'; videoUrl: string; status: 'draft' | 'published' }): DailyFlowPost => {
  if (post.id) {
    const updated = updatePost(post.id, post);
    if (updated) return updated;
  }
  
  return createPost(post as Omit<DailyFlowPost, 'id' | 'createdAt' | 'updatedAt'>);
};

// Delete a post
export const deletePost = (id: string): boolean => {
  const posts = getAllPosts();
  const filteredPosts = posts.filter(post => post.id !== id);
  
  if (filteredPosts.length === posts.length) return false;
  
  savePosts(filteredPosts);
  return true;
};

// Publish a post (auto-unpublish previous post for that day)
export const publishPost = (id: string): DailyFlowPost | null => {
  const posts = getAllPosts();
  const postToPublish = posts.find(post => post.id === id);
  
  if (!postToPublish) return null;
  
  const now = new Date().toISOString();
  
  // Unpublish any currently published post for the same day
  posts.forEach(post => {
    if (post.day === postToPublish.day && post.status === 'published' && post.id !== id) {
      post.status = 'draft';
      post.updatedAt = now;
    }
  });
  
  // Publish the target post
  const index = posts.findIndex(post => post.id === id);
  posts[index] = {
    ...posts[index],
    status: 'published',
    publishedAt: now,
    updatedAt: now,
  };
  
  savePosts(posts);
  return posts[index];
};

// Unpublish a post (set to draft)
export const unpublishPost = (id: string): DailyFlowPost | null => {
  return updatePost(id, { status: 'draft' });
};

// Get visual settings for a day
export const getDayVisualSettings = (day: DayOfWeek): DailyFlowVisualSettings => {
  try {
    const stored = localStorage.getItem(VISUAL_SETTINGS_STORAGE_KEY);
    const allSettings: Record<DayOfWeek, DailyFlowVisualSettings> = stored ? JSON.parse(stored) : {};
    return allSettings[day] || defaultDailyFlowVisualSettings;
  } catch {
    return defaultDailyFlowVisualSettings;
  }
};

// Save visual settings for a day
export const saveDayVisualSettings = (day: DayOfWeek, settings: DailyFlowVisualSettings): void => {
  try {
    const stored = localStorage.getItem(VISUAL_SETTINGS_STORAGE_KEY);
    const allSettings: Record<DayOfWeek, DailyFlowVisualSettings> = stored ? JSON.parse(stored) : {};
    allSettings[day] = settings;
    localStorage.setItem(VISUAL_SETTINGS_STORAGE_KEY, JSON.stringify(allSettings));
  } catch (error) {
    console.error('Failed to save visual settings', error);
  }
};

// Get all visual settings
export const getAllVisualSettings = (): Partial<Record<DayOfWeek, DailyFlowVisualSettings>> => {
  try {
    const stored = localStorage.getItem(VISUAL_SETTINGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Get drafts for a specific day
export const getDraftsForDay = (day: DayOfWeek): DailyFlowPost[] => {
  return getAllPosts().filter(post => post.day === day && post.status === 'draft');
};
