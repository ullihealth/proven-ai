// Guides & Resources Store - Frontend-only localStorage implementation
// Designed to support 100+ guides and future backend migration

import { Guide, GuideCluster, GuideLifecycleState, GuideDifficulty, lifecycleSortOrder } from './types';

const GUIDES_STORAGE_KEY = 'provenai_guides';
const CLUSTERS_STORAGE_KEY = 'provenai_guide_clusters';

// Sample data for initial state
const sampleClusters: GuideCluster[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Your first steps into AI, designed to build confidence without overwhelm.',
    order: 0,
    maxGuides: 5,
  },
  {
    id: 'practical-applications',
    title: 'Practical Applications',
    description: 'Real-world guides for using AI in your daily work and business.',
    order: 1,
    maxGuides: 7,
  },
  {
    id: 'safety-and-privacy',
    title: 'Safety & Privacy',
    description: 'Essential knowledge for using AI responsibly and securely.',
    order: 2,
    maxGuides: 5,
  },
];

const sampleGuides: Guide[] = [
  {
    id: 'getting-started-intro',
    slug: 'getting-started',
    title: 'Getting Started with AI: A Gentle Introduction',
    description: 'Your first steps into AI, written specifically for those who feel overwhelmed or uncertain.',
    whoFor: 'Absolute beginners who feel intimidated by AI',
    whyMatters: 'A calm starting point reduces anxiety and builds confidence',
    lastUpdated: '2026-01-28',
    lifecycleState: 'current',
    difficulty: 'beginner',
    tags: ['introduction', 'beginners', 'fundamentals'],
    primaryClusterId: 'getting-started',
    orderInCluster: 0,
    showInCluster: true,
    showInDiscovery: true,
    viewCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'choosing-first-tool',
    slug: 'choosing-first-tool',
    title: 'Choosing Your First AI Tool',
    description: 'How to select the right AI tool for your needs without getting lost in options.',
    whoFor: 'Anyone unsure which AI tool to try first',
    whyMatters: 'Starting with the right tool saves frustration',
    lastUpdated: '2026-01-22',
    lifecycleState: 'current',
    difficulty: 'beginner',
    tags: ['tools', 'getting-started', 'decision-making'],
    primaryClusterId: 'getting-started',
    orderInCluster: 1,
    showInCluster: true,
    showInDiscovery: true,
    viewCount: 0,
    createdAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'ai-privacy-security',
    slug: 'ai-privacy-security',
    title: 'Privacy & Security When Using AI',
    description: 'What to know about keeping your data safe when using AI tools.',
    whoFor: 'Privacy-conscious professionals',
    whyMatters: 'Using AI safely is non-negotiable',
    lastUpdated: '2026-01-18',
    lifecycleState: 'current',
    difficulty: 'intermediate',
    tags: ['security', 'privacy', 'data-safety'],
    primaryClusterId: 'safety-and-privacy',
    orderInCluster: 0,
    showInCluster: true,
    showInDiscovery: true,
    viewCount: 0,
    createdAt: '2026-01-03T00:00:00Z',
  },
  {
    id: 'ai-small-business',
    slug: 'ai-small-business',
    title: 'Setting Up AI for Your Small Business',
    description: 'Practical guide to implementing AI tools in a small business context.',
    whoFor: 'Small business owners and freelancers',
    whyMatters: 'AI can level the playing field for smaller operations',
    lastUpdated: '2026-01-12',
    lifecycleState: 'current',
    difficulty: 'intermediate',
    tags: ['business', 'implementation', 'practical'],
    primaryClusterId: 'practical-applications',
    orderInCluster: 0,
    showInCluster: true,
    showInDiscovery: true,
    viewCount: 0,
    createdAt: '2026-01-04T00:00:00Z',
  },
];

// Initialize storage with sample data if empty
function initializeStorage(): void {
  if (!localStorage.getItem(CLUSTERS_STORAGE_KEY)) {
    localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(sampleClusters));
  }
  if (!localStorage.getItem(GUIDES_STORAGE_KEY)) {
    localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(sampleGuides));
  }
}

// ==================== CLUSTERS ====================

export function getClusters(): GuideCluster[] {
  initializeStorage();
  const data = localStorage.getItem(CLUSTERS_STORAGE_KEY);
  const clusters = data ? JSON.parse(data) : [];
  return clusters.sort((a: GuideCluster, b: GuideCluster) => a.order - b.order);
}

export function getClusterById(id: string): GuideCluster | undefined {
  return getClusters().find(c => c.id === id);
}

export function saveCluster(cluster: GuideCluster): void {
  const clusters = getClusters();
  const existingIndex = clusters.findIndex(c => c.id === cluster.id);
  
  if (existingIndex >= 0) {
    clusters[existingIndex] = cluster;
  } else {
    clusters.push(cluster);
  }
  
  localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(clusters));
}

export function deleteCluster(id: string): void {
  const clusters = getClusters().filter(c => c.id !== id);
  localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(clusters));
  
  // Remove cluster assignment from guides
  const guides = getGuides().map(g => 
    g.primaryClusterId === id ? { ...g, primaryClusterId: null } : g
  );
  localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(guides));
}

export function reorderClusters(clusterIds: string[]): void {
  const clusters = getClusters();
  const reordered = clusterIds.map((id, index) => {
    const cluster = clusters.find(c => c.id === id);
    return cluster ? { ...cluster, order: index } : null;
  }).filter(Boolean) as GuideCluster[];
  
  localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(reordered));
}

// ==================== GUIDES ====================

export function getGuides(): Guide[] {
  initializeStorage();
  const data = localStorage.getItem(GUIDES_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getGuideById(id: string): Guide | undefined {
  return getGuides().find(g => g.id === id);
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return getGuides().find(g => g.slug === slug);
}

export function saveGuide(guide: Guide): void {
  const guides = getGuides();
  const existingIndex = guides.findIndex(g => g.id === guide.id);
  
  if (existingIndex >= 0) {
    guides[existingIndex] = guide;
  } else {
    guides.push(guide);
  }
  
  localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(guides));
}

export function deleteGuide(id: string): void {
  const guides = getGuides().filter(g => g.id !== id);
  localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(guides));
}

// ==================== CLUSTER VIEW QUERIES ====================

export function getGuidesForCluster(clusterId: string): Guide[] {
  const cluster = getClusterById(clusterId);
  if (!cluster) return [];
  
  return getGuides()
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
    .filter(({ guides }) => guides.length > 0); // Only show clusters with content
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
  
  let guides = getGuides().filter(g => g.showInDiscovery);
  
  // Apply filters
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
  
  // Apply sorting
  switch (sort) {
    case 'latest':
      guides.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'popular':
      guides.sort((a, b) => b.viewCount - a.viewCount);
      break;
    case 'difficulty':
      const difficultyOrder: Record<GuideDifficulty, number> = {
        beginner: 0,
        intermediate: 1,
        advanced: 2,
      };
      guides.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
      break;
  }
  
  return guides;
}

// ==================== SEARCH INTEGRATION ====================

export function searchGuides(query: string): Guide[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  
  return getGuides()
    .filter(g => 
      g.title.toLowerCase().includes(lowerQuery) ||
      g.tags.some(t => t.toLowerCase().includes(lowerQuery))
    )
    .sort((a, b) => {
      // Lifecycle-aware ranking: Current > Reference > Legacy
      const lifecycleDiff = lifecycleSortOrder[a.lifecycleState] - lifecycleSortOrder[b.lifecycleState];
      if (lifecycleDiff !== 0) return lifecycleDiff;
      
      // Then by title match quality
      const aExact = a.title.toLowerCase().includes(lowerQuery);
      const bExact = b.title.toLowerCase().includes(lowerQuery);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return 0;
    });
}

// ==================== ADMIN: REORDERING ====================

export function reorderGuidesInCluster(clusterId: string, guideIds: string[]): void {
  const guides = getGuides();
  
  const updated = guides.map(g => {
    if (g.primaryClusterId === clusterId) {
      const newOrder = guideIds.indexOf(g.id);
      return newOrder >= 0 ? { ...g, orderInCluster: newOrder } : g;
    }
    return g;
  });
  
  localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(updated));
}

// ==================== TAGS ====================

export function getAllTags(): string[] {
  const guides = getGuides();
  const tagSet = new Set<string>();
  guides.forEach(g => g.tags.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

// ==================== METRICS ====================

export function incrementViewCount(guideId: string): void {
  const guides = getGuides();
  const guide = guides.find(g => g.id === guideId);
  if (guide) {
    guide.viewCount += 1;
    localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(guides));
  }
}
