import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ContentItem } from "@/components/content/ContentItem";

const guides = [
  {
    title: "Getting Started with AI: A Gentle Introduction",
    description: "Your first steps into AI, written specifically for those who feel overwhelmed or uncertain.",
    whoFor: "Absolute beginners who feel intimidated by AI",
    whyMatters: "A calm starting point reduces anxiety and builds confidence",
    href: "/learn/guides/getting-started",
    lastUpdated: "January 28, 2026",
  },
  {
    title: "Choosing Your First AI Tool",
    description: "How to select the right AI tool for your needs without getting lost in options.",
    whoFor: "Anyone unsure which AI tool to try first",
    whyMatters: "Starting with the right tool saves frustration",
    href: "/learn/guides/choosing-first-tool",
    lastUpdated: "January 22, 2026",
  },
  {
    title: "Privacy & Security When Using AI",
    description: "What to know about keeping your data safe when using AI tools.",
    whoFor: "Privacy-conscious professionals",
    whyMatters: "Using AI safely is non-negotiable",
    href: "/learn/guides/ai-privacy-security",
    lastUpdated: "January 18, 2026",
  },
  {
    title: "Setting Up AI for Your Small Business",
    description: "Practical guide to implementing AI tools in a small business context.",
    whoFor: "Small business owners and freelancers",
    whyMatters: "AI can level the playing field for smaller operations",
    href: "/learn/guides/ai-small-business",
    lastUpdated: "January 12, 2026",
  },
];

const Guides = () => {
  return (
    <AppLayout>
      <PageHeader
        title="Guides"
        description="In-depth guides on specific topics. Each guide is designed to take you from uncertainty to clarity."
      />

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {guides.map((guide) => (
          <ContentItem
            key={guide.title}
            {...guide}
            variant="list"
          />
        ))}
      </div>
    </AppLayout>
  );
};

export default Guides;
