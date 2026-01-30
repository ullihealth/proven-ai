import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";

interface Tool {
  name: string;
  category: string;
  description: string;
  pricing: string;
  href: string;
}

const tools: Tool[] = [
  {
    name: "ChatGPT",
    category: "General Assistant",
    description: "OpenAI's conversational AI for writing, analysis, and general tasks.",
    pricing: "Free tier available",
    href: "/tools/chatgpt",
  },
  {
    name: "Claude",
    category: "General Assistant",
    description: "Anthropic's AI assistant, known for nuanced writing and analysis.",
    pricing: "Free tier available",
    href: "/tools/claude",
  },
  {
    name: "Gemini",
    category: "General Assistant",
    description: "Google's AI with strong integration with Google Workspace.",
    pricing: "Free tier available",
    href: "/tools/gemini",
  },
  {
    name: "Perplexity",
    category: "Research",
    description: "AI-powered search that provides sourced answers to questions.",
    pricing: "Free tier available",
    href: "/tools/perplexity",
  },
  {
    name: "Midjourney",
    category: "Image Generation",
    description: "Create artistic images from text descriptions.",
    pricing: "Paid only",
    href: "/tools/midjourney",
  },
  {
    name: "DALL-E",
    category: "Image Generation",
    description: "OpenAI's image generation integrated with ChatGPT.",
    pricing: "Credits system",
    href: "/tools/dalle",
  },
  {
    name: "Otter.ai",
    category: "Transcription",
    description: "Automated meeting transcription and note-taking.",
    pricing: "Free tier available",
    href: "/tools/otter",
  },
  {
    name: "Grammarly",
    category: "Writing",
    description: "AI-powered writing assistant for grammar and style.",
    pricing: "Free tier available",
    href: "/tools/grammarly",
  },
];

const categories = [...new Set(tools.map(t => t.category))];

const ToolsDirectory = () => {
  return (
    <AppLayout>
      <PageHeader
        title="Tools Directory"
        description="A curated collection of AI tools with honest assessments. No affiliate links, just practical guidance."
      />

      {categories.map((category) => (
        <section key={category} className="mb-10">
          <h2 className="text-lg font-medium text-foreground mb-4">{category}</h2>
          
          <div className="grid gap-3">
            {tools
              .filter(t => t.category === category)
              .map((tool) => (
                <Link
                  key={tool.name}
                  to={tool.href}
                  className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/20 hover:shadow-pai-sm transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {tool.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {tool.pricing}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-pai-text-secondary">
                      {tool.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-4" />
                </Link>
              ))}
          </div>
        </section>
      ))}
    </AppLayout>
  );
};

export default ToolsDirectory;
