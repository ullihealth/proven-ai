import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearningPath, Course } from "@/lib/courses/types";
import { getCoursesForPath } from "@/data/coursesData";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface LearningPathCardProps {
  path: LearningPath;
  defaultOpen?: boolean;
}

export const LearningPathCard = ({ path, defaultOpen = false }: LearningPathCardProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const pathCourses = getCoursesForPath(path.id);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <CollapsibleTrigger className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/50 transition-colors">
          <div className="mt-0.5">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-foreground">
              {path.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {path.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {pathCourses.length} course{pathCourses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border">
            {pathCourses.map((course, index) => (
              <PathCourseItem
                key={course.id}
                course={course}
                order={index + 1}
                isLast={index === pathCourses.length - 1}
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
}

const PathCourseItem = ({ course, order, isLast }: PathCourseItemProps) => {
  return (
    <Link
      to={course.href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group",
        !isLast && "border-b border-border"
      )}
    >
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
        {order}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
          {course.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <Clock className="h-3 w-3" />
          <span>{course.estimatedTime}</span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
};
