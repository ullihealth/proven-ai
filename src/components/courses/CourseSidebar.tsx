import { Link, useLocation } from "react-router-dom";
import { Check, Lock, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Lesson, LessonStatus } from "@/lib/courses/lessonTypes";
import { groupLessonsByChapter, getLessonStatus } from "@/lib/courses/lessonTypes";
import type { Course } from "@/lib/courses/types";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CourseSidebarProps {
  course: Course;
  lessons: Lesson[];
  completedLessonIds: string[];
  currentLessonId?: string;
  progressPercent: number;
  onMobileClose?: () => void;
}

export const CourseSidebar = ({
  course,
  lessons,
  completedLessonIds,
  currentLessonId,
  progressPercent,
  onMobileClose,
}: CourseSidebarProps) => {
  const location = useLocation();
  const groupedLessons = groupLessonsByChapter(lessons);
  const [openChapters, setOpenChapters] = useState<Set<string>>(
    new Set(Array.from(groupedLessons.keys()))
  );

  const toggleChapter = (chapter: string) => {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapter)) {
        next.delete(chapter);
      } else {
        next.add(chapter);
      }
      return next;
    });
  };

  const getLessonIcon = (status: LessonStatus) => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-primary" />;
      case "locked":
        return <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />;
      case "current":
      case "available":
        return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <aside className="flex flex-col h-full bg-muted/30 border-r border-border">
      {/* Course Header */}
      <div className="p-4 border-b border-border">
        <Link
          to="/learn/courses"
          className="text-xs text-muted-foreground hover:text-foreground mb-2 block"
          onClick={onMobileClose}
        >
          ← All Courses
        </Link>
        <h2 className="font-semibold text-foreground line-clamp-2">
          {course.title}
        </h2>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progress</span>
            <span className="font-medium">{progressPercent}% Complete</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Lesson List */}
      <ScrollArea className="flex-1">
        <nav className="p-2">
          {Array.from(groupedLessons.entries()).map(([chapter, chapterLessons]) => (
            <Collapsible
              key={chapter}
              open={openChapters.has(chapter)}
              onOpenChange={() => toggleChapter(chapter)}
            >
              <CollapsibleTrigger className="flex items-center w-full px-2 py-2 text-sm font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors">
                {openChapters.has(chapter) ? (
                  <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                )}
                {chapter}
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <ul className="ml-2 space-y-0.5">
                  {chapterLessons.map((lesson, index) => {
                    const status = getLessonStatus(lesson, lessons, completedLessonIds);
                    const isCurrent = lesson.id === currentLessonId;
                    const isLocked = status === "locked";
                    const lessonPath = `/learn/courses/${course.slug}/lesson/${lesson.id}`;
                    const isActive = location.pathname === lessonPath;

                    return (
                      <li key={lesson.id}>
                        {isLocked ? (
                          <div
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 text-sm rounded-md",
                              "text-muted-foreground/50 cursor-not-allowed"
                            )}
                          >
                            <span className="flex-shrink-0">
                              {getLessonIcon(status)}
                            </span>
                            <span className="line-clamp-1">
                              {lesson.order}. {lesson.title}
                            </span>
                          </div>
                        ) : (
                          <Link
                            to={lessonPath}
                            onClick={onMobileClose}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : isCurrent
                                ? "bg-muted text-foreground"
                                : "text-foreground hover:bg-muted/50"
                            )}
                          >
                            <span className="flex-shrink-0">
                              {getLessonIcon(status)}
                            </span>
                            <span className="line-clamp-1">
                              {lesson.order}. {lesson.title}
                            </span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
};
