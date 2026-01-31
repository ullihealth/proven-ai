import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import { toolsData, getToolCategories } from "@/data/toolsData";

const ToolsDirectory = () => {
  const categories = getToolCategories();

  return (
    <AppLayout>
      <PageHeader
        title="Tools Directory"
        description="A curated collection of AI tools with honest assessments. No affiliate links, no rankings — just practical guidance for real work."
      />

      {categories.map((category) => (
        <section key={category} className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4 tracking-tight">
            {category}
          </h2>

          <div className="grid gap-3">
            {toolsData
              .filter((tool) => tool.category === category)
              .map((tool) => (
                <Link
                  key={tool.id}
                  to={`/tools/${tool.id}`}
                  className="flex items-center justify-between p-5 rounded-lg bg-card border border-border hover:border-primary/30 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {tool.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tool.sections.whatProblemSolves.slice(0, 100)}...
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-4" />
                </Link>
              ))}
          </div>
        </section>
      ))}

      <div className="mt-12 p-6 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm text-muted-foreground">
          This directory focuses on tools that help you think, communicate, and work more effectively. 
          Each tool is evaluated honestly — we highlight both strengths and limitations.
        </p>
      </div>
    </AppLayout>
  );
};

export default ToolsDirectory;
