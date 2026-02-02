import { Link } from "react-router-dom";
import { ArrowRight, Globe, Smartphone, Monitor, Puzzle, Star } from "lucide-react";
import { DirectoryTool, pricingInfo, platformInfo } from "@/data/directoryToolsData";
import { TrustBadge } from "./TrustBadge";
import { cn } from "@/lib/utils";
import { getDirectoryCardSettings, getToolLogo, hslToCss, shadowFromIntensity } from "@/lib/tools";
import { useMemo } from "react";

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
  
  // Get customization settings
  const settings = useMemo(() => getDirectoryCardSettings(), []);
  const logo = useMemo(() => getToolLogo(tool.id), [tool.id]);
  
  return (
    <Link
      to={detailPath}
      className={cn(
        "block p-4 rounded-xl transition-all group active:scale-[0.99] touch-manipulation",
        isArchived && "opacity-60"
      )}
      style={{
        backgroundColor: hslToCss(settings.cardBackground),
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: hslToCss(settings.cardBorder),
        boxShadow: shadowFromIntensity(settings.cardShadow ?? 0),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hslToCss(settings.cardHoverBorder);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = hslToCss(settings.cardBorder);
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {logo && (
              <img 
                src={logo} 
                alt={`${tool.name} logo`} 
                className="w-6 h-6 rounded object-contain"
              />
            )}
            {tool.isCoreTool && (
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: hslToCss(settings.badgeBackground),
                  color: hslToCss(settings.badgeTextColor),
                }}
              >
                <Star className="h-3 w-3" />
                Core
              </span>
            )}
            <h3 
              className={cn(
                "font-semibold text-base group-hover:text-primary transition-colors",
                isArchived && "line-through"
              )}
              style={{ color: hslToCss(settings.titleColor) }}
            >
              {tool.name}
            </h3>
            {!tool.isCoreTool && <TrustBadge level={tool.trustLevel} />}
          </div>
        </div>
        <div 
          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors flex-shrink-0"
          style={{ backgroundColor: `${hslToCss(settings.accentColor)}20` }}
        >
          <ArrowRight 
            className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" 
            style={{ color: hslToCss(settings.accentColor) }}
          />
        </div>
      </div>
      
      {/* Best for line */}
      <p 
        className="mt-2 text-sm leading-relaxed line-clamp-2"
        style={{ color: hslToCss(settings.descriptionColor) }}
      >
        {tool.bestFor}
      </p>
      
      {/* Meta row */}
      <div 
        className="mt-3 flex items-center gap-3 flex-wrap text-xs"
        style={{ color: hslToCss(settings.descriptionColor) }}
      >
        {/* Pricing */}
        <span 
          className="px-2 py-0.5 rounded-md"
          style={{ 
            backgroundColor: hslToCss(settings.subCardPositiveBackground),
            color: hslToCss(settings.subCardTextColor),
          }}
        >
          {pricingInfo[tool.pricingModel].label}
        </span>
        
        {/* Platforms */}
        <div className="flex items-center gap-1">
          {tool.platforms.slice(0, 3).map(platform => (
            <span 
              key={platform} 
              title={platformInfo[platform].label}
              style={{ color: hslToCss(settings.descriptionColor) }}
            >
              {platformIcons[platform]}
            </span>
          ))}
          {tool.platforms.length > 3 && (
            <span className="text-xs">+{tool.platforms.length - 3}</span>
          )}
        </div>
        
        {/* Last reviewed */}
        <span 
          className="ml-auto text-xs"
          style={{ color: hslToCss(settings.descriptionColor), opacity: 0.7 }}
        >
          {tool.lastReviewed}
        </span>
      </div>
    </Link>
  );
};
