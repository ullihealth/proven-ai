import { DailyFlowPage } from "@/components/daily/DailyFlowPage";

const mondayItems = [
  {
    title: "Understanding AI Fundamentals",
    description: "What AI actually is, how it works at a high level, and why it matters for your daily life and work.",
    whoFor: "Complete beginners or those wanting a solid refresher",
    whyMatters: "A clear foundation prevents misunderstandings later",
    href: "/content/ai-fundamentals",
    lastUpdated: "January 27, 2026",
  },
  {
    title: "The Difference Between AI, ML, and LLMs",
    description: "Cutting through the jargon to understand these related but distinct technologies.",
    whoFor: "Anyone confused by AI terminology",
    whyMatters: "Knowing the terms helps you evaluate claims and tools",
    href: "/content/ai-ml-llm-differences",
    lastUpdated: "January 20, 2026",
  },
  {
    title: "How Language Models Learn",
    description: "A non-technical explanation of how ChatGPT and similar tools actually work.",
    whoFor: "Curious minds who want to understand the 'how'",
    whyMatters: "Understanding the mechanics helps you use AI more effectively",
    href: "/content/how-llms-learn",
    lastUpdated: "January 13, 2026",
  },
];

const MondayFlow = () => {
  return (
    <DailyFlowPage
      day="Monday"
      theme="Foundations"
      description="Build your understanding with core concepts and principles. Monday is about the fundamentals that everything else builds upon."
      items={mondayItems}
    />
  );
};

export default MondayFlow;
