// Guides & Resources Architecture Types

export type GuideLifecycleState = 'current' | 'reference' | 'legacy';
export type GuideDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Guide {
  id: string;
  slug: string;
  title: string;
  description: string;
  whoFor: string;
  whyMatters: string;
  lastUpdated: string;
  
  // Classification
  lifecycleState: GuideLifecycleState;
  difficulty: GuideDifficulty;
  tags: string[];
  
  // Cluster assignment
  primaryClusterId: string | null; // Single cluster assignment
  orderInCluster: number; // Manual ordering within cluster
  
  // Visibility controls
  showInCluster: boolean; // Appears in cluster view
  showInDiscovery: boolean; // Appears in discovery/browse view
  
  // Optional visual
  thumbnailUrl?: string;
  
  // Metrics (for sorting)
  viewCount: number;
  createdAt: string;
}

export interface GuideCluster {
  id: string;
  title: string;
  description: string;
  order: number; // Manual ordering of clusters on landing page
  maxGuides: number; // Default 5-7
}

// Display labels
export const lifecycleStateLabels: Record<GuideLifecycleState, string> = {
  current: 'Current',
  reference: 'Reference',
  legacy: 'Legacy',
};

export const difficultyLabels: Record<GuideDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

// Sort priority for lifecycle states (for search ranking)
export const lifecycleSortOrder: Record<GuideLifecycleState, number> = {
  current: 0,
  reference: 1,
  legacy: 2,
};

// Default values for new guides
export const defaultGuide: Omit<Guide, 'id' | 'slug' | 'title' | 'description'> = {
  whoFor: '',
  whyMatters: '',
  lastUpdated: new Date().toISOString().split('T')[0],
  lifecycleState: 'current',
  difficulty: 'beginner',
  tags: [],
  primaryClusterId: null,
  orderInCluster: 0,
  showInCluster: true,
  showInDiscovery: true,
  viewCount: 0,
  createdAt: new Date().toISOString(),
};
