import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { toolsData } from "@/data/toolsData";
import { ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Core tools are manually ordered for beginners
const coreToolOrder = ["chatgpt", "claude", "canva", "notion-ai", "microsoft-copilot"];

const CoreTools = () => {
  const orderedCoreTools = coreToolOrder
    .map(id => toolsData.find(tool => tool.id === id))
    .filter(Boolean);

  return (
    <AppLayout>
      <PageHeader
        title="Core Tools"
        description="The essential AI tools we recommend you start with. Each one has been carefully selected and documented to help you build confidence."
      />

      {/* Intro callout */}
      <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Star className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Why these tools?</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              We've identified these 5 tools as the best starting points for anyone new to AI. 
              They're reliable, well-supported, and cover the most common needs. 
              Master these first, then explore the full directory.
            </p>
          </div>
        </div>
      </div>

      {/* Core tool cards */}
      <div className="space-y-4">
        {orderedCoreTools.map((tool) => (
          tool && (
          <Link
            key={tool.id}
            to={`/tools/${tool.id}`}
            className="block p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group active:scale-[0.99] touch-manipulation"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Badge + Name */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-medium">
                    <Star className="h-3 w-3" />
                    Core
                  </span>
                  <span className="text-xs text-muted-foreground">{tool.category}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                
                {/* Why this tool is core */}
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {tool.sections.whatProblemSolves}
                </p>

                {/* When to use / not use preview */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-accent/50 border border-border">
                    <p className="text-xs font-medium text-foreground mb-1.5">
                      Use when you...
                    </p>
                    <ul className="space-y-1">
                      {tool.sections.whoFor.goodFit.slice(0, 2).map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs font-medium text-foreground mb-1.5">
                      Skip if you...
                    </p>
                    <ul className="space-y-1">
                      {tool.sections.whoFor.notGoodFit.slice(0, 2).map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-muted-foreground mt-0.5">✗</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
          )
        ))}
      </div>

      {/* Footer CTA to directory */}
      <div className="mt-8 p-5 rounded-xl bg-muted/50 border border-border text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Ready to explore more? Browse our full directory of 140+ AI tools.
        </p>
        <Link
          to="/tools/directory"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-border hover:border-primary/30 text-sm font-medium text-foreground transition-colors"
        >
          Browse All Tools
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AppLayout>
  );
};

export default CoreTools;
