import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ContentPageTemplate } from "@/components/content/ContentPageTemplate";
import { ExternalLink } from "lucide-react";

const toolsData: Record<string, {
  name: string;
  description: string;
  whoFor: string;
  whyMatters: string;
  lastUpdated: string;
  website: string;
  overview: string;
  prosAndCons: { pros: string[]; cons: string[] };
}> = {
  chatgpt: {
    name: "ChatGPT",
    description: "OpenAI's flagship conversational AI assistant for writing, analysis, coding, and general tasks.",
    whoFor: "Anyone looking for a versatile AI assistant",
    whyMatters: "The most widely-used AI tool with extensive capabilities",
    lastUpdated: "January 28, 2026",
    website: "https://chat.openai.com",
    overview: "ChatGPT is a conversational AI that can help with writing, research, analysis, coding, and creative tasks. It's accessible via web, mobile apps, and API.",
    prosAndCons: {
      pros: [
        "Very versatile — handles most tasks well",
        "Large knowledge base",
        "Regular updates and improvements",
        "Good mobile apps",
      ],
      cons: [
        "Can sometimes produce confident-sounding but incorrect information",
        "Free tier has usage limits during peak times",
        "Premium subscription required for latest features",
      ],
    },
  },
  claude: {
    name: "Claude",
    description: "Anthropic's AI assistant known for nuanced writing, careful analysis, and longer context windows.",
    whoFor: "Professionals needing thoughtful writing and analysis",
    whyMatters: "Often preferred for complex writing tasks",
    lastUpdated: "January 25, 2026",
    website: "https://claude.ai",
    overview: "Claude is an AI assistant from Anthropic that excels at nuanced writing, careful reasoning, and working with longer documents. Known for being particularly helpful and honest.",
    prosAndCons: {
      pros: [
        "Excellent for long-form writing",
        "Handles very long documents well",
        "Often more nuanced than competitors",
        "Clean, simple interface",
      ],
      cons: [
        "Smaller ecosystem than ChatGPT",
        "Some features still catching up",
        "Less widely integrated with other tools",
      ],
    },
  },
};

const ToolDetail = () => {
  const { toolId } = useParams();
  const tool = toolsData[toolId || ""];

  if (!tool) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold text-foreground">Tool Not Found</h1>
          <p className="mt-2 text-pai-text-secondary">
            This tool detail page is coming soon.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ContentPageTemplate
        title={tool.name}
        description={tool.description}
        whoFor={tool.whoFor}
        whyMatters={tool.whyMatters}
        lastUpdated={tool.lastUpdated}
      >
        <section className="space-y-6">
          <h2>Overview</h2>
          <p>{tool.overview}</p>

          <a
            href={tool.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            Visit {tool.name}
            <ExternalLink className="h-4 w-4" />
          </a>

          <h2>Pros & Cons</h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-accent/50 border border-accent">
              <h4 className="font-medium text-foreground mb-3">Strengths</h4>
              <ul className="space-y-2">
                {tool.prosAndCons.pros.map((pro, i) => (
                  <li key={i} className="text-sm text-pai-text-secondary flex items-start gap-2">
                    <span className="text-pai-success">✓</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 rounded-lg bg-pai-surface border border-pai-border-subtle">
              <h4 className="font-medium text-foreground mb-3">Limitations</h4>
              <ul className="space-y-2">
                {tool.prosAndCons.cons.map((con, i) => (
                  <li key={i} className="text-sm text-pai-text-secondary flex items-start gap-2">
                    <span className="text-pai-text-muted">–</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </ContentPageTemplate>
    </AppLayout>
  );
};

export default ToolDetail;
