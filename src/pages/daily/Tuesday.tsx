import { DailyFlowPage } from "@/components/daily/DailyFlowPage";

const tuesdayItems = [
  {
    title: "5 Prompting Patterns That Actually Work",
    description: "Move beyond basic prompts with proven patterns for better AI outputs.",
    whoFor: "Anyone ready to level up their prompting skills",
    whyMatters: "Better prompts = better results, less frustration",
    href: "/content/prompting-patterns",
    lastUpdated: "January 28, 2026",
  },
  {
    title: "Setting Up Your AI Workspace",
    description: "Practical tips for organizing bookmarks, saved prompts, and workflows.",
    whoFor: "Regular AI users who want to be more efficient",
    whyMatters: "Organisation reduces friction and saves time",
    href: "/content/ai-workspace-setup",
    lastUpdated: "January 21, 2026",
  },
  {
    title: "Quick Tips: Voice Input for AI",
    description: "How to use voice-to-text effectively with AI tools for faster input.",
    whoFor: "Anyone who finds typing long prompts tedious",
    whyMatters: "Voice can be 3x faster than typing for many people",
    href: "/content/voice-input-tips",
    lastUpdated: "January 14, 2026",
  },
];

const TuesdayFlow = () => {
  return (
    <DailyFlowPage
      day="Tuesday"
      theme="Tools & Tips"
      description="Practical techniques and shortcuts to make your AI usage more efficient and effective."
      items={tuesdayItems}
    />
  );
};

export default TuesdayFlow;
