import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock, ArrowRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Course, CourseVisualSettings } from "@/lib/courses/types";
import { courseTypeLabels, lifecycleStateLabels, defaultVisualSettings, defaultGradientColors, difficultyLabels } from "@/lib/courses/types";
import { AIOverlayEffects } from "./AIOverlayEffects";
import {
  getCourseCardSettings,
  hslToCss,
  shadowFromIntensity,
  getDifficultyBadgeStyles,
  getLifecycleBadgeStyles,
} from "@/lib/courses/courseCardCustomization";

interface CustomizableCourseCardProps {
  course: Course;
  className?: string;
}

export const CustomizableCourseCard = ({ course, className }: CustomizableCourseCardProps) => {
  const {
    title,
    description,
    estimatedTime,
    courseType,
    lifecycleState,
    difficulty,
    capabilityTags = [],
    lastUpdated,
    href,
    visualSettings = defaultVisualSettings,
  } = course;

  const {
    backgroundMode,
    backgroundImage,
    overlayStrength,
    textTheme,
    accentColor,
    logoUrl,
    gradientFrom,
    gradientVia,
    gradientTo,
    overlayEffect = 'none',
  } = visualSettings;

  // Get card customization settings
  const cardSettings = useMemo(() => getCourseCardSettings(), []);

  // Determine text colors based on theme
  const isDarkText = textTheme === 'dark';
  const textPrimary = isDarkText ? 'text-foreground' : 'text-white';
  const textSecondary = isDarkText ? 'text-muted-foreground' : 'text-white/90';
  const textMuted = isDarkText ? 'text-muted-foreground/70' : 'text-white/80';

  // Build gradient style for custom colors
  const gradientStyle = backgroundMode === 'gradient' ? {
    background: `linear-gradient(to bottom right, ${gradientFrom || defaultGradientColors.from}, ${gradientVia || defaultGradientColors.via}, ${gradientTo || defaultGradientColors.to})`
  } : undefined;

  // Background class based on mode
  const getBackgroundClass = () => {
    switch (backgroundMode) {
      case 'gradient':
        return '';
      case 'image':
        return '';
      case 'plain':
      default:
        return '';
    }
  };

  // For plain mode, use card customization settings
  const plainCardStyle = backgroundMode === 'plain' ? {
    backgroundColor: hslToCss(cardSettings.cardBackground),
    borderColor: hslToCss(cardSettings.cardBorder),
    boxShadow: shadowFromIntensity(cardSettings.cardShadow, cardSettings.cardShadowDirection),
  } : {};

  // Border and accent color
  const borderStyle = accentColor
    ? { borderColor: accentColor }
    : undefined;

  const accentBorderClass = accentColor
    ? ''
    : backgroundMode === 'plain'
      ? ''
      : 'border-white/10 hover:border-white/20';

  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col",
        "rounded-xl overflow-hidden",
        "border transition-all duration-300",
        getBackgroundClass(),
        accentBorderClass,
        // Fixed height for uniform cards
        "h-[280px]",
        className
      )}
      style={{ 
        ...borderStyle, 
        ...gradientStyle,
        ...plainCardStyle,
      }}
    >
      {/* Background image layer */}
      {backgroundMode === 'image' && backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayStrength / 100 }}
          />
        </>
      )}

      {/* Gradient mode subtle texture */}
      {backgroundMode === 'gradient' && overlayEffect === 'none' && (
        <div className="absolute inset-0 opacity-[0.04] z-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent" />
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent" />
        </div>
      )}

      {/* AI Overlay Effect */}
      {backgroundMode === 'gradient' && overlayEffect !== 'none' && (
        <AIOverlayEffects effect={overlayEffect} />
      )}

      {/* Glow effect for gradient/image modes */}
      {backgroundMode !== 'plain' && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none">
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-20 flex flex-col h-full p-5">
        {/* Logo row */}
        {logoUrl && (
          <div className="mb-2 h-8">
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-8 rounded-lg object-contain"
            />
          </div>
        )}

        {/* Title - fixed 2 lines */}
        <h3 
          className={cn(
            "font-medium transition-colors line-clamp-2",
            textPrimary,
            "group-hover:text-primary",
            "h-[48px]" // Fixed height for 2 lines
          )}
          style={backgroundMode === 'plain' ? {
            color: hslToCss(cardSettings.titleColor),
            fontSize: `${cardSettings.titleTypography.fontSize}px`,
            fontWeight: cardSettings.titleTypography.fontWeight,
          } : undefined}
        >
          {title}
        </h3>

        {/* Description - fixed 1 line */}
        <p 
          className={cn("mt-1 line-clamp-1 h-[20px]", textSecondary)}
          style={backgroundMode === 'plain' ? {
            color: hslToCss(cardSettings.descriptionColor),
            fontSize: `${cardSettings.descriptionTypography.fontSize}px`,
            fontWeight: cardSettings.descriptionTypography.fontWeight,
          } : undefined}
        >
          {description}
        </p>

        {/* Metadata row: time, type, lifecycle */}
        <div 
          className={cn("mt-3 flex flex-wrap items-center gap-2", textMuted)}
          style={backgroundMode === 'plain' ? {
            color: hslToCss(cardSettings.metaColor),
            fontSize: `${cardSettings.metaTypography.fontSize}px`,
          } : undefined}
        >
          <span className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {estimatedTime}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2 py-0 font-normal",
              isDarkText
                ? "border-border bg-muted text-muted-foreground"
                : "border-white/20 bg-white/5 text-white/70"
            )}
            style={backgroundMode === 'plain' ? {
              backgroundColor: hslToCss(cardSettings.courseTypeBadgeBackground),
              borderColor: hslToCss(cardSettings.courseTypeBadgeBorder),
              color: hslToCss(cardSettings.courseTypeBadgeText),
            } : undefined}
          >
            {courseTypeLabels[courseType]}
          </Badge>
          {(() => {
            // Check visibility toggle for this lifecycle state
            const isVisible = lifecycleState === 'current' ? cardSettings.showCurrentBadge
              : lifecycleState === 'reference' ? cardSettings.showReferenceBadge
              : cardSettings.showLegacyBadge;
            
            if (!isVisible) return null;
            
            const lcStyle = getLifecycleBadgeStyles(cardSettings, lifecycleState);
            return (
              <Badge
                variant="outline"
                className="text-xs px-2 py-0 font-normal"
                style={backgroundMode === 'plain' ? {
                  backgroundColor: hslToCss(lcStyle.background),
                  borderColor: hslToCss(lcStyle.border),
                  color: hslToCss(lcStyle.text),
                } : {
                  borderColor: lifecycleState === 'current' ? 'hsl(var(--primary) / 0.4)' : undefined,
                  color: lifecycleState === 'current' ? 'hsl(var(--primary))' : undefined,
                }}
              >
                {lifecycleStateLabels[lifecycleState]}
              </Badge>
            );
          })()}
        </div>

        {/* Difficulty badge + Skills dropdown row */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {/* Difficulty badge (if set) - left aligned */}
          {difficulty && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={(() => {
                const diffStyle = getDifficultyBadgeStyles(cardSettings, difficulty);
                return {
                  backgroundColor: hslToCss(diffStyle.background),
                  border: `1px solid ${hslToCss(diffStyle.border)}`,
                  color: hslToCss(diffStyle.text),
                };
              })()}
            >
              {difficultyLabels[difficulty]}
            </span>
          )}
          
          {!difficulty && <div />}

          {/* Skills dropdown - right aligned */}
          {capabilityTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-muted/50"
                  style={backgroundMode === 'plain' ? {
                    backgroundColor: hslToCss(cardSettings.tagBackground),
                    borderColor: hslToCss(cardSettings.tagBorder),
                    color: hslToCss(cardSettings.tagText),
                    border: `1px solid ${hslToCss(cardSettings.tagBorder)}`,
                  } : {
                    backgroundColor: isDarkText ? 'hsl(var(--muted))' : 'rgba(255,255,255,0.1)',
                    color: isDarkText ? 'hsl(var(--muted-foreground))' : 'rgba(255,255,255,0.7)',
                    border: isDarkText ? '1px solid hsl(var(--border))' : '1px solid rgba(255,255,255,0.2)',
                  }}
                  onClick={(e) => e.preventDefault()}
                >
                  Skills ({capabilityTags.length})
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[120px]">
                {capabilityTags.map(tag => (
                  <DropdownMenuItem key={tag} className="text-xs cursor-default">
                    {tag}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Footer with last updated and arrow */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span 
            className={cn("text-xs", textMuted)}
            style={backgroundMode === 'plain' ? {
              color: hslToCss(cardSettings.metaColor),
            } : undefined}
          >
            Updated {lastUpdated}
          </span>
          <ArrowRight className={cn(
            "h-4 w-4 group-hover:translate-x-0.5 transition-all",
            textMuted,
            "group-hover:text-primary"
          )} />
        </div>
      </div>
    </Link>
  );
};
