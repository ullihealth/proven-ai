import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ContentItem } from "@/components/content/ContentItem";

const prompts = [
  {
    title: "Email Writing Prompts",
    description: "Ready-to-use prompts for drafting professional emails in various contexts.",
    whoFor: "Anyone who writes business emails",
    whyMatters: "Copy-paste prompts save time and improve consistency",
    href: "/learn/prompts/email-writing",
    lastUpdated: "January 27, 2026",
  },
  {
    title: "Research & Analysis Prompts",
    description: "Prompts for summarizing, analyzing, and extracting insights from documents.",
    whoFor: "Professionals who work with reports and documents",
    whyMatters: "Turn hours of reading into minutes of insight",
    href: "/learn/prompts/research-analysis",
    lastUpdated: "January 21, 2026",
  },
  {
    title: "Meeting & Notes Prompts",
    description: "Prompts for preparing agendas, summarizing meetings, and organizing notes.",
    whoFor: "Anyone who attends or runs meetings",
    whyMatters: "Better meeting prep and follow-up in less time",
    href: "/learn/prompts/meeting-notes",
    lastUpdated: "January 15, 2026",
  },
  {
    title: "Creative Writing Prompts",
    description: "Prompts for brainstorming, storytelling, and creative projects.",
    whoFor: "Those exploring AI for creative purposes",
    whyMatters: "AI can be a powerful creative collaborator",
    href: "/learn/prompts/creative-writing",
    lastUpdated: "January 8, 2026",
  },
];

const Prompts = () => {
  return (
    <AppLayout>
      <PageHeader
        title="Prompts"
        description="Ready-to-use prompts for common tasks. Copy, customize, and use immediately."
      />

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {prompts.map((prompt) => (
          <ContentItem
            key={prompt.title}
            {...prompt}
            variant="list"
          />
        ))}
      </div>
    </AppLayout>
  );
};

export default Prompts;
