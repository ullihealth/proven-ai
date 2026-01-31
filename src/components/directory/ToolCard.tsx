import { Link } from "react-router-dom";
import { ArrowRight, Globe, Smartphone, Monitor, Puzzle } from "lucide-react";
import { DirectoryTool, pricingInfo, platformInfo } from "@/data/directoryToolsData";
import { TrustBadge } from "./TrustBadge";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  tool: DirectoryTool;
}

const platformIcons: Record<string, React.ReactNode> = {
  web: <Globe className="h-3.5 w-3.5" />,
  ios: <Smartphone className="h-3.5 w-3.5" />,
  android: <Smartphone className="h-3.5 w-3.5" />,
  desktop: <Monitor className="h-3.5 w-3.5" />,
  extension: <Puzzle className="h-3.5 w-3.5" />,
};

export const ToolCard = ({ tool }: ToolCardProps) => {
  const isArchived = tool.trustLevel === 'archived';
  const detailPath = tool.coreToolId ? `/tools/${tool.coreToolId}` : `/directory/${tool.id}`;
  
  return (
    <Link
      to={detailPath}
      className={cn(
        "block p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group active:scale-[0.99] touch-manipulation",
        isArchived && "opacity-60"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn(
              "font-semibold text-foreground text-base group-hover:text-primary transition-colors",
              isArchived && "line-through"
            )}>
              {tool.name}
            </h3>
            <TrustBadge level={tool.trustLevel} />
          </div>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
          <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
      
      {/* Best for line */}
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {tool.bestFor}
      </p>
      
      {/* Meta row */}
      <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        {/* Pricing */}
        <span className="px-2 py-0.5 bg-muted rounded-md">
          {pricingInfo[tool.pricingModel].label}
        </span>
        
        {/* Platforms */}
        <div className="flex items-center gap-1">
          {tool.platforms.slice(0, 3).map(platform => (
            <span 
              key={platform} 
              className="text-muted-foreground"
              title={platformInfo[platform].label}
            >
              {platformIcons[platform]}
            </span>
          ))}
          {tool.platforms.length > 3 && (
            <span className="text-xs">+{tool.platforms.length - 3}</span>
          )}
        </div>
        
        {/* Last reviewed */}
        <span className="ml-auto text-xs text-muted-foreground/70">
          {tool.lastReviewed}
        </span>
      </div>
    </Link>
  );
};
