export interface JeffsPicksCategory {
  name: string;
  toolIds: string[];
}

export const jeffsPicksCategories: JeffsPicksCategory[] = [
  {
    name: "General Conversation",
    toolIds: ['chatgpt', 'claude', 'gemini', 'perplexity', 'microsoft-copilot'],
  },
  {
    name: "Project Management",
    toolIds: ['notion-ai', 'clickup-ai', 'taskade', 'motion', 'mem'],
  },
  {
    name: "Image Generation",
    toolIds: ['midjourney', 'dall-e', 'adobe-firefly', 'ideogram', 'canva'],
  },
  {
    name: "Video Generation",
    toolIds: ['runway', 'pika', 'heygen', 'invideo', 'lumen5'],
  },
  {
    name: "Music Generation",
    toolIds: ['soundraw'],
  },
  {
    name: "Vibe Coding",
    toolIds: ['cursor', 'replit-ai', 'github-copilot', 'codeium'],
  },
];
