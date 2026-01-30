import { DailyFlowPage } from "@/components/daily/DailyFlowPage";

const fridayItems = [
  {
    title: "The Philosophy of AI Assistance",
    description: "Thinking about what it means to work alongside AI — partnership, not replacement.",
    whoFor: "Reflective professionals thinking about the bigger picture",
    whyMatters: "Mindset shapes how effectively you use tools",
    href: "/content/ai-philosophy",
    lastUpdated: "January 24, 2026",
  },
  {
    title: "Reader Question: Building Confidence with AI",
    description: "Addressing common concerns about feeling 'too old' or 'not technical enough' for AI.",
    whoFor: "Anyone struggling with AI confidence",
    whyMatters: "You're not alone, and these feelings are solvable",
    href: "/content/ai-confidence",
    lastUpdated: "January 17, 2026",
  },
  {
    title: "Weekend Project: Create Your First AI Workflow",
    description: "A step-by-step weekend activity to automate something simple but useful.",
    whoFor: "Hands-on learners ready for a practical project",
    whyMatters: "Learning by doing beats passive consumption",
    href: "/content/weekend-ai-project",
    lastUpdated: "January 10, 2026",
  },
];

const FridayFlow = () => {
  return (
    <DailyFlowPage
      day="Friday"
      theme="Flexible / Insight"
      description="Varied content for deeper thinking. Reflections, reader questions, and weekend projects."
      items={fridayItems}
    />
  );
};

export default FridayFlow;
