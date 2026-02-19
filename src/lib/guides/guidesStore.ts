/**
 * Guides & Resources Store — D1-backed via /api/guides + /api/admin/guides
 * In-memory cache: loadGuidesData() fetches once, getGuides()/getClusters() read cache.
 */

import { Guide, GuideCluster, GuideLifecycleState, GuideDifficulty, lifecycleSortOrder } from './types';

// ---- In-memory cache ----
let guidesCache: Guide[] = [];
let clustersCache: GuideCluster[] = [];
let cacheLoaded = false;

/** Load guides + clusters from D1 — call once on app init */
export async function loadGuidesData(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const res = await fetch('/api/guides');
    if (res.ok) {
      const json = await res.json() as { ok: boolean; guides: Guide[]; clusters: GuideCluster[] };
      if (json.ok) {
        guidesCache = json.guides || [];
        clustersCache = (json.clusters || []).sort((a, b) => a.order - b.order);
      }
    }
  } catch (err) {
    console.error('[guidesStore] load failed:', err);
  }
  cacheLoaded = true;
}

// ==================== CLUSTERS ====================

export function getClusters(): GuideCluster[] {
  return [...clustersCache].sort((a, b) => a.order - b.order);
}

export function getClusterById(id: string): GuideCluster | undefined {
  return clustersCache.find(c => c.id === id);
}

export async function saveCluster(cluster: GuideCluster): Promise<void> {
  const existing = clustersCache.find(c => c.id === cluster.id);
  try {
    if (existing) {
      await fetch('/api/admin/guide-clusters', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cluster),
      });
      const idx = clustersCache.findIndex(c => c.id === cluster.id);
      if (idx >= 0) clustersCache[idx] = cluster;
    } else {
      await fetch('/api/admin/guide-clusters', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cluster),
      });
      clustersCache.push(cluster);
    }
  } catch (err) {
    console.error('[guidesStore] saveCluster failed:', err);
  }
}

export async function deleteCluster(id: string): Promise<void> {
  try {
    await fetch(`/api/admin/guide-clusters?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    clustersCache = clustersCache.filter(c => c.id !== id);
    // Nullify this cluster on local guides cache too
    guidesCache = guidesCache.map(g =>
      g.primaryClusterId === id ? { ...g, primaryClusterId: null } : g
    );
  } catch (err) {
    console.error('[guidesStore] deleteCluster failed:', err);
  }
}

export async function reorderClusters(clusterIds: string[]): Promise<void> {
  try {
    await fetch('/api/admin/guide-clusters', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clusterIds }),
    });
    // Update local cache ordering
    clusterIds.forEach((id, idx) => {
      const c = clustersCache.find(cl => cl.id === id);
      if (c) c.order = idx;
    });
  } catch (err) {
    console.error('[guidesStore] reorderClusters failed:', err);
  }
}

// ==================== GUIDES ====================

export function getGuides(): Guide[] {
  return guidesCache;
}

export function getGuideById(id: string): Guide | undefined {
  return guidesCache.find(g => g.id === id);
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return guidesCache.find(g => g.slug === slug);
}

export async function saveGuide(guide: Guide): Promise<void> {
  const existing = guidesCache.find(g => g.id === guide.id);
  try {
    if (existing) {
      await fetch('/api/admin/guides', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guide),
      });
      const idx = guidesCache.findIndex(g => g.id === guide.id);
      if (idx >= 0) guidesCache[idx] = guide;
    } else {
      await fetch('/api/admin/guides', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guide),
      });
      guidesCache.push(guide);
    }
  } catch (err) {
    console.error('[guidesStore] saveGuide failed:', err);
  }
}

export async function deleteGuide(id: string): Promise<void> {
  try {
    await fetch(`/api/admin/guides?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    guidesCache = guidesCache.filter(g => g.id !== id);
  } catch (err) {
    console.error('[guidesStore] deleteGuide failed:', err);
  }
}

// ==================== CLUSTER VIEW QUERIES ====================

export function getGuidesForCluster(clusterId: string): Guide[] {
  const cluster = getClusterById(clusterId);
  if (!cluster) return [];
  
  return guidesCache
    .filter(g => 
      g.primaryClusterId === clusterId && 
      g.showInCluster && 
      g.lifecycleState === 'current'
    )
    .sort((a, b) => a.orderInCluster - b.orderInCluster)
    .slice(0, cluster.maxGuides);
}

export function getClustersWithGuides(): Array<{ cluster: GuideCluster; guides: Guide[] }> {
  const clusters = getClusters();
  return clusters
    .map(cluster => ({
      cluster,
      guides: getGuidesForCluster(cluster.id),
    }))
    .filter(({ guides }) => guides.length > 0);
}

// ==================== DISCOVERY VIEW QUERIES ====================

export type SortOption = 'latest' | 'popular' | 'difficulty';

export function getDiscoveryGuides(options: {
  sort?: SortOption;
  lifecycleFilter?: GuideLifecycleState | 'all';
  difficultyFilter?: GuideDifficulty | 'all';
  tagFilter?: string;
  searchQuery?: string;
}): Guide[] {
  const {
    sort = 'latest',
    lifecycleFilter = 'all',
    difficultyFilter = 'all',
    tagFilter,
    searchQuery,
  } = options;
  
  let guides = guidesCache.filter(g => g.showInDiscovery);
  
  if (lifecycleFilter !== 'all') {
    guides = guides.filter(g => g.lifecycleState === lifecycleFilter);
  }
  
  if (difficultyFilter !== 'all') {
    guides = guides.filter(g => g.difficulty === difficultyFilter);
  }
  
  if (tagFilter) {
    guides = guides.filter(g => g.tags.includes(tagFilter));
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    guides = guides.filter(g => 
      g.title.toLowerCase().includes(query) ||
      g.description.toLowerCase().includes(query) ||
      g.tags.some(t => t.toLowerCase().includes(query))
    );
  }
  
  switch (sort) {
    case 'latest':
      guides.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'popular':
      guides.sort((a, b) => b.viewCount - a.viewCount);
      break;
    case 'difficulty': {
      const difficultyOrder: Record<GuideDifficulty, number> = {
        beginner: 0,
        intermediate: 1,
        advanced: 2,
      };
      guides.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
      break;
    }
  }
  
  return guides;
}

// ==================== SEARCH INTEGRATION ====================

export function searchGuides(query: string): Guide[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  
  return guidesCache
    .filter(g => 
      g.title.toLowerCase().includes(lowerQuery) ||
      g.tags.some(t => t.toLowerCase().includes(lowerQuery))
    )
    .sort((a, b) => {
      const lifecycleDiff = lifecycleSortOrder[a.lifecycleState] - lifecycleSortOrder[b.lifecycleState];
      if (lifecycleDiff !== 0) return lifecycleDiff;
      
      const aExact = a.title.toLowerCase().includes(lowerQuery);
      const bExact = b.title.toLowerCase().includes(lowerQuery);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return 0;
    });
}

// ==================== ADMIN: REORDERING ====================

export async function reorderGuidesInCluster(clusterId: string, guideIds: string[]): Promise<void> {
  try {
    await fetch('/api/admin/guides', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clusterId, guideIds }),
    });
    // Update local cache
    guidesCache = guidesCache.map(g => {
      if (g.primaryClusterId === clusterId) {
        const newOrder = guideIds.indexOf(g.id);
        return newOrder >= 0 ? { ...g, orderInCluster: newOrder } : g;
      }
      return g;
    });
  } catch (err) {
    console.error('[guidesStore] reorderGuidesInCluster failed:', err);
  }
}

// ==================== TAGS ====================

export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  guidesCache.forEach(g => g.tags.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

// ==================== METRICS ====================

export async function incrementViewCount(guideId: string): Promise<void> {
  const guide = guidesCache.find(g => g.id === guideId);
  if (!guide) return;
  guide.viewCount += 1;
  // Fire-and-forget update to D1
  try {
    await fetch('/api/admin/guides', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guide),
    });
  } catch {
    // Non-critical — local cache is already updated
  }
}
