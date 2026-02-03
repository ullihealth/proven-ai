import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearningPath, Course } from "@/lib/courses/types";
import { getCoursesForLearningPath } from "@/lib/courses/learningPathStore";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getLearningPathCardSettings,
  hslToCss,
  shadowFromIntensity,
} from "@/lib/courses/learningPathCardCustomization";

interface LearningPathCardProps {
  path: LearningPath;
  defaultOpen?: boolean;
}

export const LearningPathCard = ({ path, defaultOpen = false }: LearningPathCardProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const pathCourses = getCoursesForLearningPath(path.id);
  const settings = getLearningPathCardSettings();

  const { backgroundMode, textTheme } = settings;
  const isPlainMode = backgroundMode === 'plain';
  const isDarkText = isPlainMode || textTheme === 'dark';

  // Text color classes based on theme
  const textPrimary = isDarkText ? '' : 'text-white';
  const textSecondary = isDarkText ? '' : 'text-white/90';
  const textMuted = isDarkText ? '' : 'text-white/80';

  // Card styles based on background mode
  const getCardStyle = () => {
    if (backgroundMode === 'plain') {
      return {
        backgroundColor: hslToCss(settings.cardBackground),
        borderColor: hslToCss(settings.cardBorder),
        boxShadow: shadowFromIntensity(settings.shadowIntensity, settings.shadowDirection),
      };
    }
    if (backgroundMode === 'gradient') {
      return {
        background: `linear-gradient(to bottom right, ${settings.gradientFrom}, ${settings.gradientVia}, ${settings.gradientTo})`,
        borderColor: 'rgba(255,255,255,0.1)',
        boxShadow: shadowFromIntensity(settings.shadowIntensity, settings.shadowDirection),
      };
    }
    // image mode - border handled separately
    return {
      boxShadow: shadowFromIntensity(settings.shadowIntensity, settings.shadowDirection),
      borderColor: 'rgba(255,255,255,0.1)',
    };
  };

  // Image filter for brightness/exposure
  const getImageFilter = () => {
    const brightness = 1 + (settings.imageBrightness / 100);
    return `brightness(${brightness})`;
  };

  // Title/description/meta styles
  const titleStyle = isPlainMode ? {
    fontSize: `${settings.titleFontSize}px`,
    fontWeight: settings.titleFontWeight,
    color: hslToCss(settings.titleColor),
  } : {
    fontSize: `${settings.titleFontSize}px`,
    fontWeight: settings.titleFontWeight,
  };

  const descriptionStyle = isPlainMode ? {
    fontSize: `${settings.descriptionFontSize}px`,
    fontWeight: settings.descriptionFontWeight,
    color: hslToCss(settings.descriptionColor),
  } : {
    fontSize: `${settings.descriptionFontSize}px`,
    fontWeight: settings.descriptionFontWeight,
  };

  const metaStyle = isPlainMode ? {
    fontSize: `${settings.metaFontSize}px`,
    fontWeight: settings.metaFontWeight,
    color: hslToCss(settings.metaColor),
  } : {
    fontSize: `${settings.metaFontSize}px`,
    fontWeight: settings.metaFontWeight,
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div 
        className={cn(
          "rounded-xl border overflow-hidden relative",
          !isPlainMode && "border-white/10"
        )}
        style={getCardStyle()}
      >
        {/* Background image layer */}
        {backgroundMode === 'image' && settings.backgroundImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${settings.backgroundImage})`,
                filter: getImageFilter(),
              }}
            />
            {/* Dark overlay */}
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: settings.overlayStrength / 100 }}
            />
            {/* Exposure (white overlay) */}
            {settings.imageExposure > 0 && (
              <div
                className="absolute inset-0 bg-white"
                style={{ opacity: settings.imageExposure / 100 }}
              />
            )}
          </>
        )}

        <CollapsibleTrigger className={cn(
          "w-full p-4 flex items-start gap-3 text-left transition-colors relative z-10",
          isPlainMode ? "hover:bg-muted/50" : "hover:bg-white/5"
        )}>
          <div className="mt-0.5">
            {isOpen ? (
              <ChevronDown className={cn("h-4 w-4", isDarkText ? "text-muted-foreground" : "text-white/70")} />
            ) : (
              <ChevronRight className={cn("h-4 w-4", isDarkText ? "text-muted-foreground" : "text-white/70")} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={textPrimary} style={titleStyle}>
              {path.title}
            </h3>
            <p className={cn("mt-1", textSecondary)} style={descriptionStyle}>
              {path.description}
            </p>
            <p className={cn("mt-2", textMuted)} style={metaStyle}>
              {pathCourses.length} course{pathCourses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className={cn(
            "border-t relative z-10",
            isPlainMode ? "border-border" : "border-white/10"
          )}>
            {pathCourses.map((course, index) => (
              <PathCourseItem
                key={course.id}
                course={course}
                order={index + 1}
                isLast={index === pathCourses.length - 1}
                isDarkText={isDarkText}
                isPlainMode={isPlainMode}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

interface PathCourseItemProps {
  course: Course;
  order: number;
  isLast: boolean;
  isDarkText: boolean;
  isPlainMode: boolean;
}

const PathCourseItem = ({ course, order, isLast, isDarkText, isPlainMode }: PathCourseItemProps) => {
  return (
    <Link
      to={course.href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors group",
        isPlainMode ? "hover:bg-muted/50" : "hover:bg-white/10",
        !isLast && (isPlainMode ? "border-b border-border" : "border-b border-white/10")
      )}
    >
      <span className={cn(
        "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
        isPlainMode 
          ? "bg-muted text-muted-foreground" 
          : "bg-white/10 text-white/70"
      )}>
        {order}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium transition-colors truncate",
          isDarkText 
            ? "text-foreground group-hover:text-primary" 
            : "text-white group-hover:text-white/80"
        )}>
          {course.title}
        </p>
        <div className={cn(
          "flex items-center gap-2 text-xs mt-0.5",
          isDarkText ? "text-muted-foreground" : "text-white/60"
        )}>
          <Clock className="h-3 w-3" />
          <span>{course.estimatedTime}</span>
        </div>
      </div>
      <ArrowRight className={cn(
        "h-4 w-4 group-hover:translate-x-0.5 transition-all flex-shrink-0",
        isDarkText 
          ? "text-muted-foreground group-hover:text-primary" 
          : "text-white/60 group-hover:text-white"
      )} />
    </Link>
  );
};
