// Types for the Tools Directory

export type TrustLevel = 'unreviewed' | 'reviewed' | 'recommended' | 'core' | 'archived';
export type PricingModel = 'free' | 'freemium' | 'paid' | 'enterprise';
export type Platform = 'web' | 'ios' | 'android' | 'desktop' | 'extension';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type IntentTag = 
  | 'write' 
  | 'research' 
  | 'images' 
  | 'video' 
  | 'organise' 
  | 'present' 
  | 'automate' 
  | 'meetings' 
  | 'coding' 
  | 'business';

export type Category = 
  | 'general-ai-assistants'
  | 'writing-editing'
  | 'research-fact-checking'
  | 'images-design'
  | 'video'
  | 'audio-voice'
  | 'notes-knowledge'
  | 'productivity-automation'
  | 'meetings'
  | 'developer-tools'
  | 'business-marketing';

export interface DirectoryTool {
  id: string;
  name: string;
  bestFor: string; // One-line summary
  primaryCategory: Category;
  secondaryCategories?: Category[];
  intentTags: IntentTag[];
  platforms: Platform[];
  pricingModel: PricingModel;
  skillLevel: SkillLevel;
  trustLevel: TrustLevel;
  officialUrl: string;
  lastReviewed: string; // "January 2026"
  notes?: string; // Max 500 characters
  alternatives?: string[]; // List of tool IDs
  coreToolId?: string; // Links to Core Tool page if applicable
}

// Category display info
export const categoryInfo: Record<Category, { label: string; description: string }> = {
  'general-ai-assistants': { 
    label: 'General AI Assistants', 
    description: 'All-purpose AI chat and thinking tools' 
  },
  'writing-editing': { 
    label: 'Writing & Editing', 
    description: 'Tools for drafting, editing, and improving text' 
  },
  'research-fact-checking': { 
    label: 'Research & Fact Checking', 
    description: 'Search, citations, and verification tools' 
  },
  'images-design': { 
    label: 'Images & Design', 
    description: 'Visual creation and graphic design' 
  },
  'video': { 
    label: 'Video', 
    description: 'Video editing, generation, and enhancement' 
  },
  'audio-voice': { 
    label: 'Audio & Voice', 
    description: 'Speech, music, and audio processing' 
  },
  'notes-knowledge': { 
    label: 'Notes / Knowledge', 
    description: 'Note-taking and knowledge management' 
  },
  'productivity-automation': { 
    label: 'Productivity & Automation', 
    description: 'Workflow automation and efficiency tools' 
  },
  'meetings': { 
    label: 'Meetings', 
    description: 'Meeting transcription, notes, and scheduling' 
  },
  'developer-tools': { 
    label: 'Developer Tools', 
    description: 'Coding assistance and development utilities' 
  },
  'business-marketing': { 
    label: 'Business & Marketing', 
    description: 'Marketing, sales, and business intelligence' 
  },
};

// Intent tag display info
export const intentInfo: Record<IntentTag, { label: string; icon?: string }> = {
  'write': { label: 'Write' },
  'research': { label: 'Research' },
  'images': { label: 'Images' },
  'video': { label: 'Video' },
  'organise': { label: 'Organise' },
  'present': { label: 'Present' },
  'automate': { label: 'Automate' },
  'meetings': { label: 'Meetings' },
  'coding': { label: 'Coding' },
  'business': { label: 'Business' },
};

// Trust level display info
export const trustLevelInfo: Record<TrustLevel, { label: string; color: string; description: string }> = {
  'unreviewed': { 
    label: 'Unreviewed', 
    color: 'bg-muted text-muted-foreground',
    description: 'Captured but not yet vetted'
  },
  'reviewed': { 
    label: 'Reviewed', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    description: 'Basic assessment completed'
  },
  'recommended': { 
    label: 'Recommended', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    description: 'Strong pick for common use'
  },
  'core': { 
    label: 'Core', 
    color: 'bg-primary text-primary-foreground',
    description: 'Deep coverage available'
  },
  'archived': { 
    label: 'Archived', 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    description: 'No longer recommended'
  },
};

// Pricing model display
export const pricingInfo: Record<PricingModel, { label: string }> = {
  'free': { label: 'Free' },
  'freemium': { label: 'Freemium' },
  'paid': { label: 'Paid' },
  'enterprise': { label: 'Enterprise' },
};

// Platform display
export const platformInfo: Record<Platform, { label: string; short: string }> = {
  'web': { label: 'Web', short: 'Web' },
  'ios': { label: 'iOS', short: 'iOS' },
  'android': { label: 'Android', short: 'And' },
  'desktop': { label: 'Desktop', short: 'Desktop' },
  'extension': { label: 'Browser Extension', short: 'Ext' },
};

// Skill level display
export const skillLevelInfo: Record<SkillLevel, { label: string }> = {
  'beginner': { label: 'Beginner' },
  'intermediate': { label: 'Intermediate' },
  'advanced': { label: 'Advanced' },
};

// Seed data - 25+ tools
export const directoryTools: DirectoryTool[] = [
  // Core Tools (link to Core Tool pages)
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    bestFor: 'Thinking through ideas and getting clear answers through conversation',
    primaryCategory: 'general-ai-assistants',
    intentTags: ['write', 'research', 'coding', 'business'],
    platforms: ['web', 'ios', 'android', 'desktop'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'core',
    officialUrl: 'https://chat.openai.com',
    lastReviewed: 'January 2026',
    coreToolId: 'chatgpt',
    notes: 'The most widely used AI assistant. Great starting point for anyone new to AI.',
  },
  {
    id: 'claude',
    name: 'Claude',
    bestFor: 'Writing clearly and professionally without losing your voice',
    primaryCategory: 'writing-editing',
    secondaryCategories: ['general-ai-assistants'],
    intentTags: ['write', 'research'],
    platforms: ['web', 'ios', 'android'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'core',
    officialUrl: 'https://claude.ai',
    lastReviewed: 'January 2026',
    coreToolId: 'claude',
    notes: 'Excellent for nuanced writing and long-form content. Calmer tone than ChatGPT.',
  },
  {
    id: 'canva',
    name: 'Canva',
    bestFor: 'Creating professional visuals without design skills',
    primaryCategory: 'images-design',
    intentTags: ['images', 'present'],
    platforms: ['web', 'ios', 'android', 'desktop'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'core',
    officialUrl: 'https://www.canva.com',
    lastReviewed: 'January 2026',
    coreToolId: 'canva',
    notes: 'The go-to for non-designers. Templates make professional output accessible.',
  },
  {
    id: 'notion-ai',
    name: 'Notion AI',
    bestFor: 'Organising notes and ideas so nothing feels scattered',
    primaryCategory: 'notes-knowledge',
    secondaryCategories: ['productivity-automation'],
    intentTags: ['organise', 'write'],
    platforms: ['web', 'ios', 'android', 'desktop'],
    pricingModel: 'freemium',
    skillLevel: 'intermediate',
    trustLevel: 'core',
    officialUrl: 'https://www.notion.so/product/ai',
    lastReviewed: 'January 2026',
    coreToolId: 'notion-ai',
    notes: 'Best for people who want a single workspace for everything.',
  },
  {
    id: 'microsoft-copilot',
    name: 'Microsoft Copilot',
    bestFor: 'Getting AI help inside Word, Excel, PowerPoint, and Outlook',
    primaryCategory: 'productivity-automation',
    secondaryCategories: ['general-ai-assistants'],
    intentTags: ['write', 'present', 'automate', 'business'],
    platforms: ['web', 'desktop', 'extension'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'core',
    officialUrl: 'https://www.microsoft.com/copilot',
    lastReviewed: 'January 2026',
    coreToolId: 'microsoft-copilot',
    notes: 'Essential if you already live in Microsoft 365.',
  },

  // Recommended Tools
  {
    id: 'perplexity',
    name: 'Perplexity',
    bestFor: 'Research with real-time sources and citations',
    primaryCategory: 'research-fact-checking',
    intentTags: ['research'],
    platforms: ['web', 'ios', 'android'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'recommended',
    officialUrl: 'https://www.perplexity.ai',
    lastReviewed: 'January 2026',
    notes: 'Best for fact-checking and research. Shows sources clearly.',
    alternatives: ['chatgpt'],
  },
  {
    id: 'grammarly',
    name: 'Grammarly',
    bestFor: 'Catching grammar and style issues across all your writing',
    primaryCategory: 'writing-editing',
    intentTags: ['write'],
    platforms: ['web', 'ios', 'android', 'desktop', 'extension'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'recommended',
    officialUrl: 'https://www.grammarly.com',
    lastReviewed: 'January 2026',
    notes: 'Works everywhere you write. AI features in premium tier.',
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    bestFor: 'Creating artistic and stylised images from text prompts',
    primaryCategory: 'images-design',
    intentTags: ['images'],
    platforms: ['web'],
    pricingModel: 'paid',
    skillLevel: 'intermediate',
    trustLevel: 'recommended',
    officialUrl: 'https://www.midjourney.com',
    lastReviewed: 'January 2026',
    notes: 'Exceptional quality but requires learning prompt techniques.',
    alternatives: ['dall-e', 'stable-diffusion'],
  },
  {
    id: 'otter-ai',
    name: 'Otter.ai',
    bestFor: 'Automatic meeting transcription and note-taking',
    primaryCategory: 'meetings',
    intentTags: ['meetings', 'organise'],
    platforms: ['web', 'ios', 'android'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'recommended',
    officialUrl: 'https://otter.ai',
    lastReviewed: 'January 2026',
    notes: 'Joins meetings automatically. Great for busy professionals.',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    bestFor: 'Connecting apps and automating repetitive tasks',
    primaryCategory: 'productivity-automation',
    intentTags: ['automate'],
    platforms: ['web'],
    pricingModel: 'freemium',
    skillLevel: 'intermediate',
    trustLevel: 'recommended',
    officialUrl: 'https://zapier.com',
    lastReviewed: 'January 2026',
    notes: 'No-code automation. AI features help build workflows.',
    alternatives: ['make'],
  },

  // Reviewed Tools
  {
    id: 'dall-e',
    name: 'DALL·E',
    bestFor: 'Generating images from text within ChatGPT',
    primaryCategory: 'images-design',
    intentTags: ['images'],
    platforms: ['web'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'reviewed',
    officialUrl: 'https://openai.com/dall-e-3',
    lastReviewed: 'January 2026',
    notes: 'Integrated into ChatGPT Plus. Good for quick image generation.',
    alternatives: ['midjourney', 'stable-diffusion'],
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    bestFor: 'AI-powered code suggestions inside your editor',
    primaryCategory: 'developer-tools',
    intentTags: ['coding'],
    platforms: ['desktop', 'extension'],
    pricingModel: 'paid',
    skillLevel: 'intermediate',
    trustLevel: 'reviewed',
    officialUrl: 'https://github.com/features/copilot',
    lastReviewed: 'January 2026',
    notes: 'Essential for developers. Saves significant coding time.',
  },
  {
    id: 'jasper',
    name: 'Jasper',
    bestFor: 'Marketing copy and brand-consistent content at scale',
    primaryCategory: 'business-marketing',
    secondaryCategories: ['writing-editing'],
    intentTags: ['write', 'business'],
    platforms: ['web', 'extension'],
    pricingModel: 'paid',
    skillLevel: 'intermediate',
    trustLevel: 'reviewed',
    officialUrl: 'https://www.jasper.ai',
    lastReviewed: 'January 2026',
    notes: 'Built for marketing teams. Strong brand voice features.',
  },
  {
    id: 'descript',
    name: 'Descript',
    bestFor: 'Editing video and audio as easily as editing a document',
    primaryCategory: 'video',
    secondaryCategories: ['audio-voice'],
    intentTags: ['video'],
    platforms: ['web', 'desktop'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'reviewed',
    officialUrl: 'https://www.descript.com',
    lastReviewed: 'January 2026',
    notes: 'Revolutionary approach to video editing. Transcription-based.',
  },
  {
    id: 'runway',
    name: 'Runway',
    bestFor: 'AI-powered video generation and creative editing',
    primaryCategory: 'video',
    intentTags: ['video', 'images'],
    platforms: ['web'],
    pricingModel: 'freemium',
    skillLevel: 'intermediate',
    trustLevel: 'reviewed',
    officialUrl: 'https://runwayml.com',
    lastReviewed: 'January 2026',
    notes: 'Leading tool for AI video generation.',
  },
  {
    id: 'eleven-labs',
    name: 'ElevenLabs',
    bestFor: 'Creating realistic AI voices for audio and video content',
    primaryCategory: 'audio-voice',
    intentTags: ['video'],
    platforms: ['web'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'reviewed',
    officialUrl: 'https://elevenlabs.io',
    lastReviewed: 'January 2026',
    notes: 'Best-in-class voice synthesis. Natural sounding output.',
  },
  {
    id: 'fireflies',
    name: 'Fireflies.ai',
    bestFor: 'Meeting transcription with searchable conversation history',
    primaryCategory: 'meetings',
    intentTags: ['meetings', 'organise'],
    platforms: ['web', 'extension'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'reviewed',
    officialUrl: 'https://fireflies.ai',
    lastReviewed: 'January 2026',
    alternatives: ['otter-ai'],
  },
  {
    id: 'gamma',
    name: 'Gamma',
    bestFor: 'Creating presentations and documents from prompts',
    primaryCategory: 'productivity-automation',
    intentTags: ['present', 'write'],
    platforms: ['web'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'reviewed',
    officialUrl: 'https://gamma.app',
    lastReviewed: 'January 2026',
    notes: 'AI-native presentation tool. Great for quick decks.',
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    bestFor: 'Visual automation workflows with advanced logic',
    primaryCategory: 'productivity-automation',
    intentTags: ['automate'],
    platforms: ['web'],
    pricingModel: 'freemium',
    skillLevel: 'intermediate',
    trustLevel: 'reviewed',
    officialUrl: 'https://www.make.com',
    lastReviewed: 'January 2026',
    alternatives: ['zapier'],
    notes: 'More powerful than Zapier but steeper learning curve.',
  },
  {
    id: 'copy-ai',
    name: 'Copy.ai',
    bestFor: 'Quick marketing copy and social media content',
    primaryCategory: 'business-marketing',
    intentTags: ['write', 'business'],
    platforms: ['web'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'reviewed',
    officialUrl: 'https://www.copy.ai',
    lastReviewed: 'January 2026',
    alternatives: ['jasper'],
  },

  // Unreviewed Tools
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    bestFor: 'Open-source image generation with full control',
    primaryCategory: 'images-design',
    intentTags: ['images'],
    platforms: ['web', 'desktop'],
    pricingModel: 'free',
    skillLevel: 'advanced',
    trustLevel: 'unreviewed',
    officialUrl: 'https://stability.ai',
    lastReviewed: 'January 2026',
    alternatives: ['midjourney', 'dall-e'],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    bestFor: 'AI-first code editor with deep codebase understanding',
    primaryCategory: 'developer-tools',
    intentTags: ['coding'],
    platforms: ['desktop'],
    pricingModel: 'freemium',
    skillLevel: 'intermediate',
    trustLevel: 'unreviewed',
    officialUrl: 'https://cursor.sh',
    lastReviewed: 'January 2026',
    alternatives: ['github-copilot'],
  },
  {
    id: 'beautiful-ai',
    name: 'Beautiful.ai',
    bestFor: 'Auto-designing presentations as you add content',
    primaryCategory: 'productivity-automation',
    intentTags: ['present'],
    platforms: ['web'],
    pricingModel: 'paid',
    skillLevel: 'beginner',
    trustLevel: 'unreviewed',
    officialUrl: 'https://www.beautiful.ai',
    lastReviewed: 'January 2026',
    alternatives: ['gamma'],
  },
  {
    id: 'synthesia',
    name: 'Synthesia',
    bestFor: 'Creating videos with AI avatars from text scripts',
    primaryCategory: 'video',
    intentTags: ['video', 'present'],
    platforms: ['web'],
    pricingModel: 'paid',
    skillLevel: 'beginner',
    trustLevel: 'unreviewed',
    officialUrl: 'https://www.synthesia.io',
    lastReviewed: 'January 2026',
  },
  {
    id: 'mem',
    name: 'Mem',
    bestFor: 'AI-powered note-taking that surfaces relevant info',
    primaryCategory: 'notes-knowledge',
    intentTags: ['organise', 'write'],
    platforms: ['web', 'ios', 'desktop'],
    pricingModel: 'freemium',
    skillLevel: 'beginner',
    trustLevel: 'unreviewed',
    officialUrl: 'https://mem.ai',
    lastReviewed: 'January 2026',
    alternatives: ['notion-ai'],
  },
  {
    id: 'superhuman',
    name: 'Superhuman',
    bestFor: 'Lightning-fast email with AI-powered writing assistance',
    primaryCategory: 'productivity-automation',
    intentTags: ['write', 'automate'],
    platforms: ['web', 'ios', 'android', 'desktop'],
    pricingModel: 'paid',
    skillLevel: 'intermediate',
    trustLevel: 'unreviewed',
    officialUrl: 'https://superhuman.com',
    lastReviewed: 'January 2026',
  },

  // Archived example
  {
    id: 'jasper-chat',
    name: 'Jasper Chat',
    bestFor: 'Conversational AI for marketing (now part of Jasper)',
    primaryCategory: 'business-marketing',
    intentTags: ['write', 'business'],
    platforms: ['web'],
    pricingModel: 'paid',
    skillLevel: 'beginner',
    trustLevel: 'archived',
    officialUrl: 'https://www.jasper.ai',
    lastReviewed: 'December 2025',
    notes: 'Merged into main Jasper product. Use Jasper instead.',
    alternatives: ['jasper'],
  },
];

// Helper functions
export const getDirectoryToolById = (id: string): DirectoryTool | undefined => {
  return directoryTools.find(tool => tool.id === id);
};

export const getToolsByCategory = (category: Category): DirectoryTool[] => {
  return directoryTools.filter(tool => 
    tool.primaryCategory === category || 
    tool.secondaryCategories?.includes(category)
  );
};

export const getToolsByIntent = (intent: IntentTag): DirectoryTool[] => {
  return directoryTools.filter(tool => tool.intentTags.includes(intent));
};

export const getToolsByTrustLevel = (level: TrustLevel): DirectoryTool[] => {
  return directoryTools.filter(tool => tool.trustLevel === level);
};

export const searchTools = (query: string): DirectoryTool[] => {
  const lowerQuery = query.toLowerCase();
  return directoryTools.filter(tool =>
    tool.name.toLowerCase().includes(lowerQuery) ||
    tool.bestFor.toLowerCase().includes(lowerQuery) ||
    tool.notes?.toLowerCase().includes(lowerQuery)
  );
};

export const getAllCategories = (): Category[] => {
  return Object.keys(categoryInfo) as Category[];
};

export const getAllIntentTags = (): IntentTag[] => {
  return Object.keys(intentInfo) as IntentTag[];
};
