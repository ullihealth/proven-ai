import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ContentItem } from "@/components/content/ContentItem";

const tools = [
  {
    title: "Image Generation with AI",
    description: "Learn to create images using AI tools like DALL-E, Midjourney, and others.",
    whoFor: "Anyone needing images for work or personal projects",
    whyMatters: "Create custom visuals without design skills",
    href: "/learn/tools/image-generation",
    lastUpdated: "January 26, 2026",
  },
  {
    title: "Voice & Audio AI Tools",
    description: "Explore AI tools for transcription, voice synthesis, and audio editing.",
    whoFor: "Content creators, meeting-heavy professionals",
    whyMatters: "Unlock new ways to create and consume content",
    href: "/learn/tools/voice-audio",
    lastUpdated: "January 19, 2026",
  },
  {
    title: "AI Writing Assistants Compared",
    description: "Side-by-side comparison of popular AI writing tools and when to use each.",
    whoFor: "Anyone choosing between writing tools",
    whyMatters: "The right tool depends on your specific needs",
    href: "/learn/tools/writing-assistants",
    lastUpdated: "January 12, 2026",
  },
];

const LearnTools = () => {
  return (
    <AppLayout>
      <PageHeader
        title="Tools"
        description="Learn how to use specific AI tools effectively. Practical tutorials and comparisons."
      />

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {tools.map((tool) => (
          <ContentItem
            key={tool.title}
            {...tool}
            variant="list"
          />
        ))}
      </div>
    </AppLayout>
  );
};

export default LearnTools;
