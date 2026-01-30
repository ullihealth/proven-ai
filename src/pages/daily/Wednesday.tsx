import { DailyFlowPage } from "@/components/daily/DailyFlowPage";

const wednesdayItems = [
  {
    title: "AI for Professional Writing",
    description: "Using AI to draft, edit, and improve business documents without losing your voice.",
    whoFor: "Professionals who write emails, reports, or proposals",
    whyMatters: "Save hours each week while maintaining quality",
    href: "/content/ai-professional-writing",
    lastUpdated: "January 29, 2026",
  },
  {
    title: "Creating a Personal AI Strategy",
    description: "How to think about AI in the context of your career and life goals.",
    whoFor: "Mid-career professionals planning for the future",
    whyMatters: "Strategic thinking beats reactive scrambling",
    href: "/content/personal-ai-strategy",
    lastUpdated: "January 22, 2026",
  },
  {
    title: "AI Side Projects That Pay",
    description: "Realistic ways to generate extra income with AI skills.",
    whoFor: "Those interested in AI-enabled side income",
    whyMatters: "Practical, tested approaches over hype",
    href: "/content/ai-side-income",
    lastUpdated: "January 15, 2026",
  },
];

const WednesdayFlow = () => {
  return (
    <DailyFlowPage
      day="Wednesday"
      theme="Work & Wealth"
      description="Professional applications and opportunities. How AI can enhance your work and create new possibilities."
      items={wednesdayItems}
    />
  );
};

export default WednesdayFlow;
