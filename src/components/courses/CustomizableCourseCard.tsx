import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Course, CourseVisualSettings } from "@/lib/courses/types";
import { courseTypeLabels, lifecycleStateLabels, defaultVisualSettings, defaultGradientColors } from "@/lib/courses/types";

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
  } = visualSettings;

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

  // Background class based on mode
  const getBackgroundClass = () => {
    switch (backgroundMode) {
      case 'gradient':
        return ''; // Using inline style for custom gradient
      case 'image':
        return '';
      case 'plain':
      default:
        return 'bg-card';
    }
  };

  // Border and accent color
  const borderStyle = accentColor
    ? { borderColor: accentColor }
    : undefined;

  const accentBorderClass = accentColor
    ? ''
    : backgroundMode === 'plain'
      ? 'border-border hover:border-primary/30'
      : 'border-white/10 hover:border-white/20';

  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col h-full",
        "rounded-xl overflow-hidden",
        "border transition-all duration-300",
        // Elevation - soft shadow for floating effect
        "shadow-sm hover:shadow-lg",
        getBackgroundClass(),
        accentBorderClass,
        className
      )}
      style={{ ...borderStyle, ...gradientStyle }}
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
      {backgroundMode === 'gradient' && (
        <div className="absolute inset-0 opacity-[0.04] z-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent" />
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent" />
        </div>
      )}

      {/* Glow effect for gradient/image modes - behind content */}
      {backgroundMode !== 'plain' && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none">
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
        </div>
      )}

      {/* Content - always on top */}
      <div className="relative z-20 flex flex-col h-full p-5">
        {/* Logo row */}
        {logoUrl && (
          <div className="mb-3">
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-8 rounded-lg object-contain"
            />
          </div>
        )}

        {/* Title */}
        <h3 className={cn(
          "text-base font-medium transition-colors line-clamp-2",
          textPrimary,
          "group-hover:text-primary"
        )}>
          {title}
        </h3>

        {/* Description - single line truncate */}
        <p className={cn("mt-2 text-sm line-clamp-1", textSecondary)}>
          {description}
        </p>

        {/* Metadata row */}
        <div className={cn("mt-3 flex flex-wrap items-center gap-2 text-xs", textMuted)}>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {estimatedTime}
          </span>
          <span className={isDarkText ? "text-border" : "text-white/30"}>•</span>
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2 py-0 font-normal",
              isDarkText
                ? "border-border bg-muted text-muted-foreground"
                : "border-white/20 bg-white/5 text-white/70"
            )}
          >
            {courseTypeLabels[courseType]}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2 py-0 font-normal",
              isDarkText
                ? cn(
                    "border-border",
                    lifecycleState === 'current' && "border-primary/40 text-primary bg-primary/5",
                    lifecycleState === 'reference' && "text-muted-foreground",
                    lifecycleState === 'legacy' && "text-muted-foreground/70"
                  )
                : cn(
                    "border-white/20 bg-white/5",
                    lifecycleState === 'current' && "border-primary/40 text-primary bg-primary/10",
                    lifecycleState === 'reference' && "text-white/60",
                    lifecycleState === 'legacy' && "text-white/40"
                  )
            )}
          >
            {lifecycleStateLabels[lifecycleState]}
          </Badge>
        </div>

        {/* Capability tags */}
        {displayTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "text-xs px-2 py-0.5 font-normal",
                  isDarkText
                    ? "border-border bg-muted text-muted-foreground"
                    : "border-white/10 bg-white/5 text-white/60"
                )}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer with last updated and arrow */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className={cn("text-xs", textMuted)}>
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
