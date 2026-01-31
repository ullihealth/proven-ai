import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { getToolById } from "@/data/toolsData";
import { ToolSection } from "@/components/tools/ToolSection";
import { ToolFitList } from "@/components/tools/ToolFitList";
import { ToolBulletList } from "@/components/tools/ToolBulletList";
import { Button } from "@/components/ui/button";

const ToolDetail = () => {
  const { toolId } = useParams();
  const tool = getToolById(toolId || "");

  if (!tool) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold text-foreground">
            Tool Not Found
          </h1>
          <p className="mt-2 text-muted-foreground">
            This tool hasn't been added to the directory yet.
          </p>
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 mt-6 text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tools Directory
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Back link */}
      <Link
        to="/tools"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tools Directory
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="inline-block text-xs font-medium text-primary uppercase tracking-wider mb-2">
              {tool.category}
            </span>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">
              {tool.name}
            </h1>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <a
              href={tool.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit {tool.name}
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </header>

      {/* Collapsible Sections */}
      <div className="space-y-3">
        <ToolSection
          sectionNumber={1}
          title="What problem this solves"
          defaultOpen={true}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tool.sections.whatProblemSolves}
          </p>
        </ToolSection>

        <ToolSection sectionNumber={2} title="Who this is for / not for">
          <ToolFitList
            goodFit={tool.sections.whoFor.goodFit}
            notGoodFit={tool.sections.whoFor.notGoodFit}
          />
        </ToolSection>

        <ToolSection sectionNumber={3} title="What it does well">
          <ToolBulletList items={tool.sections.whatItDoesWell} />
        </ToolSection>

        <ToolSection sectionNumber={4} title="Limitations & common mistakes">
          <ToolBulletList
            items={tool.sections.limitations}
            variant="warning"
          />
        </ToolSection>

        <ToolSection sectionNumber={5} title="The Proven AI way to use it">
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
            <p className="text-sm text-foreground leading-relaxed">
              {tool.sections.provenAiWay}
            </p>
          </div>
        </ToolSection>
      </div>

      {/* Footer note */}
      <div className="mt-10 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Last reviewed by Proven AI. Tool features and pricing may change — always verify with the official source.
        </p>
      </div>
    </AppLayout>
  );
};

export default ToolDetail;
