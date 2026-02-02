import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Course, CourseVisualSettings, LifecycleState, CourseDifficulty } from "@/lib/courses/types";
import { courseTypeLabels, lifecycleStateLabels, defaultVisualSettings, defaultGradientColors } from "@/lib/courses/types";
import { AIOverlayEffects } from "./AIOverlayEffects";
import {
  getCourseCardSettings,
  hslToCss,
  shadowFromIntensity,
  type CourseCardSettings,
} from "@/lib/courses/courseCardCustomization";
import { useMemo } from "react";

interface CustomizableCourseCardProps {
  course: Course;
  className?: string;
  difficulty?: CourseDifficulty;
  // Allow passing settings for preview in admin
  customSettings?: CourseCardSettings;
}

// Helper to get difficulty badge styles based on difficulty level
function getDifficultyBadgeStyles(settings: CourseCardSettings, difficulty: CourseDifficulty) {
  switch (difficulty) {
    case 'beginner':
      return settings.beginnerBadge;
    case 'intermediate':
      return settings.intermediateBadge;
    case 'advanced':
      return settings.advancedBadge;
  }
}

// Helper to get lifecycle badge styles based on state
function getLifecycleBadgeStyles(settings: CourseCardSettings, state: LifecycleState) {
  switch (state) {
    case 'current':
      return settings.currentBadge;
    case 'reference':
      return settings.referenceBadge;
    case 'legacy':
      return settings.legacyBadge;
  }
}

export const CustomizableCourseCard = ({ 
  course, 
  className,
  difficulty,
  customSettings,
}: CustomizableCourseCardProps) => {
  const {
    title,
    description,
    estimatedTime,
    courseType,
    lifecycleState,
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

  // Get card styling settings
  const settings = useMemo(() => customSettings || getCourseCardSettings(), [customSettings]);

  // Limit tags to 6
  const displayTags = capabilityTags.slice(0, 6);

  // Determine text colors based on theme - use high contrast for dark backgrounds
  const isDarkText = textTheme === 'dark';
  const textPrimary = isDarkText ? 'text-foreground' : 'text-white';
  const textSecondary = isDarkText ? 'text-muted-foreground' : 'text-white/90';
  const textMuted = isDarkText ? 'text-muted-foreground/70' : 'text-white/80';

  // Build gradient style for custom colors
  const gradientStyle = backgroundMode === 'gradient' ? {
    background: `linear-gradient(to bottom right, ${gradientFrom || defaultGradientColors.from}, ${gradientVia || defaultGradientColors.via}, ${gradientTo || defaultGradientColors.to})`
  } : undefined;

  // Card styles from settings
  const cardStyle: React.CSSProperties = {
    backgroundColor: backgroundMode === 'plain' ? hslToCss(settings.cardBackground) : undefined,
    borderColor: accentColor || hslToCss(settings.cardBorder),
    boxShadow: shadowFromIntensity(settings.cardShadow, settings.cardShadowDirection),
    ...gradientStyle,
  };

  // Get lifecycle badge styles
  const lifecycleBadgeStyle = getLifecycleBadgeStyles(settings, lifecycleState);

  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col h-full",
        "rounded-xl overflow-hidden",
        "border transition-all duration-300",
        // Elevation - soft shadow for floating effect
        "hover:shadow-lg",
        className
      )}
      style={cardStyle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = accentColor || hslToCss(settings.cardHoverBorder);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = accentColor || hslToCss(settings.cardBorder);
      }}
    >
      {/* Background image layer */}
      {backgroundMode === 'image' && backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          {/* Overlay for text contrast */}
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayStrength / 100 }}
          />
        </>
      )}

      {/* Gradient mode subtle texture - ensure it's behind content */}
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

      {/* Glow effect for gradient/image modes - behind content */}
      {backgroundMode !== 'plain' && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none">
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
        </div>
      )}

      {/* Content - always on top */}
      <div className="relative z-20 flex flex-col h-full p-5">
        {/* Logo row - fixed height */}
        {logoUrl && (
          <div className="h-8 mb-3 flex-shrink-0">
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-8 rounded-lg object-contain"
            />
          </div>
        )}

        {/* Title - fixed height for 2 lines (approx 48px with line-height) */}
        <div className="h-12 flex-shrink-0">
          <h3 
            className={cn(
              "text-base font-medium transition-colors line-clamp-2 leading-6",
              textPrimary,
              "group-hover:text-primary"
            )}
            style={backgroundMode === 'plain' ? { color: hslToCss(settings.titleColor) } : undefined}
          >
            {title}
          </h3>
        </div>

        {/* Description - fixed height for 1 line */}
        <div className="h-5 mt-2 flex-shrink-0">
          <p 
            className={cn("text-sm line-clamp-1 leading-5", textSecondary)}
            style={backgroundMode === 'plain' ? { color: hslToCss(settings.descriptionColor) } : undefined}
          >
            {description}
          </p>
        </div>

        {/* Metadata row 1: time/type/lifecycle - fixed height */}
        <div 
          className={cn("h-6 mt-3 flex flex-wrap items-center gap-2 text-xs flex-shrink-0", textMuted)}
          style={backgroundMode === 'plain' ? { color: hslToCss(settings.metaColor) } : undefined}
        >
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {estimatedTime}
          </span>
          <span className={isDarkText ? "text-border" : "text-white/30"}>•</span>
          
          {/* Course Type Badge */}
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: hslToCss(settings.tagBackground),
              borderColor: hslToCss(settings.tagBorder),
              color: hslToCss(settings.tagText),
              border: `1px solid ${hslToCss(settings.tagBorder)}`,
            }}
          >
            {courseTypeLabels[courseType]}
          </span>
          
          {/* Lifecycle State Badge */}
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              lifecycleState === 'legacy' && "opacity-70"
            )}
            style={{
              backgroundColor: hslToCss(lifecycleBadgeStyle.background),
              borderColor: hslToCss(lifecycleBadgeStyle.border),
              color: hslToCss(lifecycleBadgeStyle.text),
              border: `1px solid ${hslToCss(lifecycleBadgeStyle.border)}`,
            }}
          >
            {lifecycleStateLabels[lifecycleState]}
          </span>
        </div>

        {/* Metadata row 2: Difficulty Badge - fixed height */}
        <div className="h-6 mt-1.5 flex items-center flex-shrink-0">
          {difficulty ? (() => {
            const diffBadgeStyle = getDifficultyBadgeStyles(settings, difficulty);
            return (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: hslToCss(diffBadgeStyle.background),
                  borderColor: hslToCss(diffBadgeStyle.border),
                  color: hslToCss(diffBadgeStyle.text),
                  border: `1px solid ${hslToCss(diffBadgeStyle.border)}`,
                }}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </span>
            );
          })() : null}
        </div>

        {/* Capability tags - fixed height for 2 rows (approx 52px) */}
        <div className="h-[52px] mt-2 flex-shrink-0 overflow-hidden">
          <div className="flex flex-wrap gap-1.5 content-start">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-normal"
                style={{
                  backgroundColor: hslToCss(settings.tagBackground),
                  borderColor: hslToCss(settings.tagBorder),
                  color: hslToCss(settings.tagText),
                  border: `1px solid ${hslToCss(settings.tagBorder)}`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer with last updated and arrow - pushed to bottom */}
        <div className="mt-auto pt-3 flex items-center justify-between flex-shrink-0">
          <span 
            className={cn("text-xs", textMuted)}
            style={backgroundMode === 'plain' ? { color: hslToCss(settings.metaColor) } : undefined}
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
