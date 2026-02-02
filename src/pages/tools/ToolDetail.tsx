import { useParams, Link, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { getToolById, toolsData } from "@/data/toolsData";
import { ToolSection } from "@/components/tools/ToolSection";
import { ToolFitList } from "@/components/tools/ToolFitList";
import { ToolBulletList } from "@/components/tools/ToolBulletList";
import { ShowMoreSection } from "@/components/tools/ShowMoreSection";
import { Button } from "@/components/ui/button";

const ToolDetail = () => {
  const { toolId } = useParams();
  const location = useLocation();
  const tool = getToolById(toolId || "");
  
  // Check if this is a core tool to determine back link
  const isCoreTool = toolsData.some(t => t.id === toolId);
  const backLink = isCoreTool ? "/core-tools" : "/tools/directory";
  const backLabel = isCoreTool ? "Back to Core Tools" : "Back to Tools Directory";

  if (!tool) {
    return (
      <AppLayout>
        <div className="text-center py-12 px-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
            Tool Not Found
          </h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">
            This tool hasn't been added to the directory yet.
          </p>
          <Link
            to="/core-tools"
            className="inline-flex items-center gap-2 mt-6 text-primary hover:underline text-sm sm:text-base min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Core Tools
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Back link - large tap target for mobile */}
      <Link
        to={backLink}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 sm:mb-6 min-h-[44px] -ml-1 px-1"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      {/* Header - Mobile optimized */}
      <header className="mb-6 sm:mb-8">
        <span className="inline-block text-xs font-medium text-primary uppercase tracking-wider mb-2">
          {tool.category}
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-4">
          {tool.name}
        </h1>
        <Button asChild variant="outline" className="gap-2 w-full sm:w-auto min-h-[48px] text-base">
          <a
            href={tool.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit {tool.name}
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </header>

      {/* Core 5 Sections - Always visible, mobile-first */}
      <div className="space-y-3">
        <ToolSection
          sectionNumber={1}
          title="What this tool is"
          defaultOpen={true}
        >
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {tool.sections.whatProblemSolves}
          </p>
        </ToolSection>

        <ToolSection sectionNumber={2} title="Who it's for / not for">
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
            <p className="text-sm sm:text-base text-foreground leading-relaxed">
              {tool.sections.provenAiWay}
            </p>
          </div>
        </ToolSection>
      </div>

      {/* Progressive Disclosure - Advanced Sections */}
      {tool.advancedSections && tool.advancedSections.length > 0 && (
        <ShowMoreSection advancedSections={tool.advancedSections} />
      )}

      {/* Footer note */}
      <div className="mt-8 sm:mt-10 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Last reviewed by Proven AI. Tool features and pricing may change — always verify with the official source.
        </p>
      </div>
    </AppLayout>
  );
};

export default ToolDetail;
