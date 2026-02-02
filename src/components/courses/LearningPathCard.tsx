import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearningPath, Course } from "@/lib/courses/types";
import { getCoursesForPath } from "@/lib/courses/coursesStore";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getLPCardSettings,
  hslToCss,
  shadowFromIntensity,
  type LearningPathCardSettings,
} from "@/lib/courses/learningPathCardCustomization";
import { useMemo } from "react";

interface LearningPathCardProps {
  path: LearningPath;
  defaultOpen?: boolean;
  customSettings?: LearningPathCardSettings;
}

export const LearningPathCard = ({ path, defaultOpen = false, customSettings }: LearningPathCardProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isHovered, setIsHovered] = useState(false);
  const pathCourses = getCoursesForPath(path.id);
  
  const settings = useMemo(() => customSettings || getLPCardSettings(), [customSettings]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: hslToCss(settings.cardBackground),
    borderColor: hslToCss(settings.cardBorder),
    boxShadow: shadowFromIntensity(settings.cardShadow, settings.cardShadowDirection),
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div 
        className="rounded-xl border overflow-hidden transition-colors"
        style={cardStyle}
      >
        <CollapsibleTrigger 
          className="w-full p-4 flex items-start gap-3 text-left transition-colors"
          style={{ 
            backgroundColor: isHovered ? hslToCss(settings.cardHoverBackground) : hslToCss(settings.cardBackground) 
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="mt-0.5">
            {isOpen ? (
              <ChevronDown 
                className="h-4 w-4" 
                style={{ color: hslToCss(settings.iconColor) }}
              />
            ) : (
              <ChevronRight 
                className="h-4 w-4" 
                style={{ color: hslToCss(settings.iconColor) }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 
              style={{
                color: hslToCss(settings.titleColor),
                fontSize: `${settings.titleTypography?.fontSize ?? 16}px`,
                fontWeight: settings.titleTypography?.fontWeight ?? 500,
              }}
            >
              {path.title}
            </h3>
            <p 
              className="mt-1"
              style={{
                color: hslToCss(settings.descriptionColor),
                fontSize: `${settings.descriptionTypography?.fontSize ?? 14}px`,
                fontWeight: settings.descriptionTypography?.fontWeight ?? 400,
              }}
            >
              {path.description}
            </p>
            <p 
              className="mt-2"
              style={{
                color: hslToCss(settings.metaColor),
                fontSize: `${settings.metaTypography?.fontSize ?? 12}px`,
                fontWeight: settings.metaTypography?.fontWeight ?? 400,
              }}
            >
              {pathCourses.length} course{pathCourses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div style={{ borderTopColor: hslToCss(settings.courseItemBorder), borderTopWidth: 1 }}>
            {pathCourses.map((course, index) => (
              <PathCourseItem
                key={course.id}
                course={course}
                order={index + 1}
                isLast={index === pathCourses.length - 1}
                settings={settings}
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
  settings: LearningPathCardSettings;
}

const PathCourseItem = ({ course, order, isLast, settings }: PathCourseItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link
      to={course.href}
      className="flex items-center gap-3 px-4 py-3 transition-colors group"
      style={{
        backgroundColor: isHovered ? hslToCss(settings.courseItemHoverBackground) : hslToCss(settings.courseItemBackground),
        borderBottomColor: !isLast ? hslToCss(settings.courseItemBorder) : undefined,
        borderBottomWidth: !isLast ? 1 : 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span 
        className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium"
        style={{
          backgroundColor: hslToCss(settings.courseNumberBackground),
          color: hslToCss(settings.courseNumberText),
        }}
      >
        {order}
      </span>
      <div className="flex-1 min-w-0">
        <p 
          className="text-sm font-medium truncate transition-colors"
          style={{ color: hslToCss(settings.courseTitleColor) }}
        >
          {course.title}
        </p>
        <div 
          className="flex items-center gap-2 text-xs mt-0.5"
          style={{ color: hslToCss(settings.courseMetaColor) }}
        >
          <Clock className="h-3 w-3" />
          <span>{course.estimatedTime}</span>
        </div>
      </div>
      <ArrowRight 
        className="h-4 w-4 group-hover:translate-x-0.5 transition-all flex-shrink-0"
        style={{ color: hslToCss(settings.iconColor) }}
      />
    </Link>
  );
};
