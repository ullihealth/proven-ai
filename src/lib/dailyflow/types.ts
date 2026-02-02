// Daily Flow Types
import { Target, Wrench, TrendingUp, Eye, Lightbulb } from "lucide-react";

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// Day configuration for consistent labeling across sidebar and pages
export const DAY_CONFIG: Record<DayOfWeek, {
  label: string;
  theme: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  monday: {
    label: 'Monday',
    theme: 'Foundations',
    description: 'Build your understanding with core concepts and principles. Monday is about the fundamentals that everything else builds upon.',
    icon: Target,
  },
  tuesday: {
    label: 'Tuesday',
    theme: 'Tools & Tips',
    description: 'Practical techniques and shortcuts to make your AI usage more efficient and effective.',
    icon: Wrench,
  },
  wednesday: {
    label: 'Wednesday',
    theme: 'Work & Wealth',
    description: 'Professional applications and opportunities. How AI can enhance your work and create new possibilities.',
    icon: TrendingUp,
  },
  thursday: {
    label: 'Thursday',
    theme: 'AI News & Updates',
    description: 'Stay informed about meaningful developments in AI. Curated news filtered for relevance, not hype.',
    icon: Eye,
  },
  friday: {
    label: 'Friday',
    theme: 'Feedback & Questions',
    description: 'Your voice matters. Share feedback, ask questions, and help shape the Proven AI experience.',
    icon: Lightbulb,
  },
};

// Video source type
export type VideoType = 'upload' | 'url';

// Post status
export type PostStatus = 'draft' | 'published';

// Daily Flow Post
export interface DailyFlowPost {
  id: string;
  day: DayOfWeek;
  title: string;
  description: string;
  videoType: VideoType;
  videoUrl: string; // MP4 URL, base64 data, or external embed URL
  caption?: string; // Optional context text
  status: PostStatus;
  publishedAt?: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
  visualSettings?: DailyFlowVisualSettings;
}

// Visual settings for Daily Flow (mirrors Course visual settings)
export type BackgroundMode = 'plain' | 'gradient' | 'image';

export interface DailyFlowVisualSettings {
  backgroundMode: BackgroundMode;
  backgroundImage?: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
  accentColor?: string;
  badgeIcon?: string;
}

// Default visual settings
export const defaultDailyFlowVisualSettings: DailyFlowVisualSettings = {
  backgroundMode: 'plain',
  gradientFrom: '#0f1729',
  gradientVia: '#1a2540',
  gradientTo: '#252f4a',
};

// Display labels
export const videoTypeLabels: Record<VideoType, string> = {
  upload: 'Upload Video',
  url: 'Video URL',
};

export const postStatusLabels: Record<PostStatus, string> = {
  draft: 'Draft',
  published: 'Published',
};
