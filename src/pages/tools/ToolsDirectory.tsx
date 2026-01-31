import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCoreTools } from "@/data/toolsData";

const ToolsDirectory = () => {
  const coreTools = getCoreTools();

  return (
    <AppLayout>
      <PageHeader
        title="Core Tools"
        description="Five essential AI tools with honest assessments. No affiliate links, no rankings — just practical guidance for real work."
      />

      {/* Mobile-first vertical list */}
      <div className="space-y-3">
        {coreTools.map((tool) => (
          <Link
            key={tool.id}
            to={`/tools/${tool.id}`}
            className="block p-4 sm:p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group active:scale-[0.99] touch-manipulation"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-base sm:text-lg group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-primary/80 font-medium">
                  {tool.category}
                </p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {tool.sections.whatProblemSolves}
            </p>
          </Link>
        ))}
      </div>

      {/* Footer guidance */}
      <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-xl bg-muted/50 border border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each tool is evaluated honestly — we highlight both strengths and limitations. 
          Tap any tool to see the full breakdown.
        </p>
      </div>
    </AppLayout>
  );
};

export default ToolsDirectory;
