import { Link } from "react-router-dom";
import { Guide, lifecycleStateLabels, difficultyLabels } from "@/lib/guides/types";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getGuideCardSettings,
  hslToCss,
  shadowFromIntensity,
} from "@/lib/guides/guideCardCustomization";
import { useMemo } from "react";

interface GuideCardProps {
  guide: Guide;
  variant?: 'cluster' | 'discovery';
  showThumbnail?: boolean;
}

export function GuideCard({ guide, variant = 'cluster', showThumbnail = false }: GuideCardProps) {
  const isLegacy = guide.lifecycleState === 'legacy';
  const isDiscovery = variant === 'discovery';
  
  // Get custom settings
  const settings = useMemo(() => getGuideCardSettings(), []);
  
  const cardStyle = {
    backgroundColor: hslToCss(settings.cardBackground),
    borderColor: hslToCss(settings.cardBorder),
    boxShadow: shadowFromIntensity(settings.cardShadow, settings.cardShadowDirection),
    '--hover-border': hslToCss(settings.cardHoverBorder),
  } as React.CSSProperties;
  
  return (
    <Link
      to={`/learn/guides/${guide.slug}`}
      className={cn(
        "block rounded-lg border p-4 transition-all hover:shadow-md",
        isLegacy && "opacity-60"
      )}
      style={cardStyle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = hslToCss(settings.cardHoverBorder);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = hslToCss(settings.cardBorder);
      }}
    >
      {/* Optional thumbnail for discovery mode */}
      {isDiscovery && showThumbnail && guide.thumbnailUrl && (
        <div className="mb-3 aspect-video w-full overflow-hidden rounded-md bg-muted">
          <img 
            src={guide.thumbnailUrl} 
            alt="" 
            className="h-full w-full object-cover"
          />
        </div>
      )}
      
      {/* Header with badges */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span 
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: hslToCss(settings.difficultyBadgeBackground),
            borderColor: hslToCss(settings.difficultyBadgeBorder),
            color: hslToCss(settings.difficultyBadgeText),
            border: `1px solid ${hslToCss(settings.difficultyBadgeBorder)}`,
          }}
        >
          {difficultyLabels[guide.difficulty]}
        </span>
        
        {isDiscovery && guide.lifecycleState !== 'current' && (
          <span 
            className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", isLegacy && "opacity-70")}
            style={{
              backgroundColor: hslToCss(settings.lifecycleBadgeBackground),
              borderColor: hslToCss(settings.lifecycleBadgeBorder),
              color: hslToCss(settings.lifecycleBadgeText),
              border: `1px solid ${hslToCss(settings.lifecycleBadgeBorder)}`,
            }}
          >
            {lifecycleStateLabels[guide.lifecycleState]}
          </span>
        )}
      </div>
      
      {/* Title */}
      <h3 
        className="mb-2 font-semibold line-clamp-2"
        style={{ color: hslToCss(settings.titleColor) }}
      >
        {guide.title}
      </h3>
      
      {/* Description */}
      <p 
        className="mb-3 text-sm line-clamp-2"
        style={{ color: hslToCss(settings.descriptionColor) }}
      >
        {guide.description}
      </p>
      
      {/* Meta info */}
      <div 
        className="flex flex-wrap items-center gap-3 text-xs"
        style={{ color: hslToCss(settings.metaColor) }}
      >
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {guide.whoFor}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {guide.lastUpdated}
        </span>
      </div>
      
      {/* Tags in discovery mode */}
      {isDiscovery && guide.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {guide.tags.slice(0, 3).map(tag => (
            <span 
              key={tag} 
              className="rounded-full px-2 py-0.5 text-xs"
              style={{
                backgroundColor: hslToCss(settings.tagBackground),
                color: hslToCss(settings.tagText),
              }}
            >
              {tag}
            </span>
          ))}
          {guide.tags.length > 3 && (
            <span 
              className="text-xs"
              style={{ color: hslToCss(settings.metaColor) }}
            >
              +{guide.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}