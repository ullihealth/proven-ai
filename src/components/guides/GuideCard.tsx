import { Link } from "react-router-dom";
import { Guide, GuideDifficulty, lifecycleStateLabels, difficultyLabels } from "@/lib/guides/types";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getGuideCardSettings,
  hslToCss,
  shadowFromIntensity,
  GuideCardSettings,
  DEFAULT_TYPOGRAPHY,
} from "@/lib/guides/guideCardCustomization";
import { useMemo } from "react";

interface GuideCardProps {
  guide: Guide;
  variant?: 'cluster' | 'discovery';
  showThumbnail?: boolean;
}

// Helper to get difficulty badge styles based on difficulty level
function getDifficultyBadgeStyles(settings: GuideCardSettings, difficulty: GuideDifficulty) {
  switch (difficulty) {
    case 'beginner':
      return settings.beginnerBadge;
    case 'intermediate':
      return settings.intermediateBadge;
    case 'advanced':
      return settings.advancedBadge;
  }
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
        {(() => {
          const badgeStyle = getDifficultyBadgeStyles(settings, guide.difficulty);
          return (
            <span 
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: hslToCss(badgeStyle.background),
                borderColor: hslToCss(badgeStyle.border),
                color: hslToCss(badgeStyle.text),
                border: `1px solid ${hslToCss(badgeStyle.border)}`,
              }}
            >
              {difficultyLabels[guide.difficulty]}
            </span>
          );
        })()}
        
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
        className="mb-2 line-clamp-2"
        style={{ 
          color: hslToCss(settings.titleColor),
          fontSize: `${settings.titleTypography?.fontSize ?? 16}px`,
          fontWeight: settings.titleTypography?.fontWeight ?? 600,
        }}
      >
        {guide.title}
      </h3>
      
      {/* Description */}
      <p 
        className="mb-3 line-clamp-2"
        style={{ 
          color: hslToCss(settings.descriptionColor),
          fontSize: `${settings.descriptionTypography?.fontSize ?? 14}px`,
          fontWeight: settings.descriptionTypography?.fontWeight ?? 400,
        }}
      >
        {guide.description}
      </p>
      
      {/* Meta info */}
      <div 
        className="flex flex-wrap items-center gap-3"
        style={{ 
          color: hslToCss(settings.metaColor),
          fontSize: `${settings.metaTypography?.fontSize ?? 12}px`,
          fontWeight: settings.metaTypography?.fontWeight ?? 400,
        }}
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