import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Globe, Smartphone, Monitor, Puzzle, Calendar, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  getDirectoryToolById, 
  categoryInfo, 
  pricingInfo, 
  platformInfo, 
  skillLevelInfo,
  intentInfo,
  DirectoryTool
} from "@/data/directoryToolsData";
import { TrustBadge } from "@/components/directory/TrustBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const platformIcons: Record<string, React.ReactNode> = {
  web: <Globe className="h-4 w-4" />,
  ios: <Smartphone className="h-4 w-4" />,
  android: <Smartphone className="h-4 w-4" />,
  desktop: <Monitor className="h-4 w-4" />,
  extension: <Puzzle className="h-4 w-4" />,
};

const DirectoryToolDetail = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const tool = toolId ? getDirectoryToolById(toolId) : undefined;

  if (!tool) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-2">Tool not found</h1>
          <p className="text-muted-foreground mb-6">The tool you're looking for doesn't exist.</p>
          <Link to="/tools" className="text-primary hover:underline">
            ← Back to Tools Directory
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isArchived = tool.trustLevel === 'archived';

  return (
    <AppLayout>
      {/* Back link */}
      <Link
        to="/tools"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tools Directory
      </Link>

      {/* Header */}
      <div className={cn("mb-6", isArchived && "opacity-60")}>
        <div className="flex items-start gap-3 mb-3">
          <h1 className={cn(
            "text-2xl sm:text-3xl font-bold text-foreground",
            isArchived && "line-through"
          )}>
            {tool.name}
          </h1>
          <TrustBadge level={tool.trustLevel} className="mt-1" />
        </div>
        <p className="text-lg text-muted-foreground">{tool.bestFor}</p>
      </div>

      {/* Archived warning */}
      {isArchived && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-800 dark:text-orange-300">This tool is archived</p>
            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
              It's no longer recommended for new users. {tool.alternatives && tool.alternatives.length > 0 && "See alternatives below."}
            </p>
          </div>
        </div>
      )}

      {/* Visit button */}
      <Button
        asChild
        size="lg"
        className="w-full sm:w-auto mb-8"
        variant={isArchived ? "outline" : "default"}
      >
        <a href={tool.officialUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 mr-2" />
          Visit {tool.name}
        </a>
      </Button>

      {/* Core tool link */}
      {tool.coreToolId && (
        <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            This is a Core Tool with detailed guidance available.
          </p>
          <Link
            to={`/tools/${tool.coreToolId}`}
            className="text-primary font-medium hover:underline"
          >
            View full Core Tool page →
          </Link>
        </div>
      )}

      {/* Tool Record Fields */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {/* Category */}
          <FieldRow label="Category">
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
                {categoryInfo[tool.primaryCategory].label}
              </span>
              {tool.secondaryCategories?.map(cat => (
                <span key={cat} className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-sm">
                  {categoryInfo[cat].label}
                </span>
              ))}
            </div>
          </FieldRow>

          {/* Intent Tags */}
          <FieldRow label="Good for">
            <div className="flex flex-wrap gap-2">
              {tool.intentTags.map(intent => (
                <span key={intent} className="px-2 py-1 bg-muted rounded-md text-sm">
                  {intentInfo[intent].label}
                </span>
              ))}
            </div>
          </FieldRow>

          {/* Platforms */}
          <FieldRow label="Platforms">
            <div className="flex flex-wrap gap-3">
              {tool.platforms.map(platform => (
                <span key={platform} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  {platformIcons[platform]}
                  {platformInfo[platform].label}
                </span>
              ))}
            </div>
          </FieldRow>

          {/* Pricing */}
          <FieldRow label="Pricing">
            <span className="text-sm font-medium">{pricingInfo[tool.pricingModel].label}</span>
          </FieldRow>

          {/* Skill Level */}
          <FieldRow label="Skill level">
            <span className="text-sm">{skillLevelInfo[tool.skillLevel].label}</span>
          </FieldRow>

          {/* Last Reviewed */}
          <FieldRow label="Last reviewed">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {tool.lastReviewed}
            </span>
          </FieldRow>

          {/* Notes */}
          {tool.notes && (
            <FieldRow label="Notes">
              <p className="text-sm text-muted-foreground leading-relaxed">{tool.notes}</p>
            </FieldRow>
          )}

          {/* Alternatives */}
          {tool.alternatives && tool.alternatives.length > 0 && (
            <FieldRow label="Alternatives">
              <div className="flex flex-wrap gap-2">
                {tool.alternatives.map(altId => {
                  const altTool = getDirectoryToolById(altId);
                  if (!altTool) return null;
                  return (
                    <Link
                      key={altId}
                      to={altTool.coreToolId ? `/tools/${altTool.coreToolId}` : `/directory/${altId}`}
                      className="px-2 py-1 bg-muted hover:bg-muted/80 rounded-md text-sm text-primary transition-colors"
                    >
                      {altTool.name}
                    </Link>
                  );
                })}
              </div>
            </FieldRow>
          )}
        </div>
      </div>

      {/* Request update link */}
      <div className="mt-6 text-center">
        <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
          Request an update to this tool →
        </button>
      </div>
    </AppLayout>
  );
};

// Helper component for consistent field rows
const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="p-4 sm:flex sm:items-start sm:gap-4">
    <dt className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0 sm:w-32 sm:flex-shrink-0">
      {label}
    </dt>
    <dd className="flex-1">{children}</dd>
  </div>
);

export default DirectoryToolDetail;
