import { Link, useLocation } from "react-router-dom";
import { Check, Lock, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Lesson, LessonStatus, Module } from "@/lib/courses/lessonTypes";
import { getLessonStatus } from "@/lib/courses/lessonTypes";
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
  modules?: Module[];
  completedLessonIds: string[];
  currentLessonId?: string;
  progressPercent: number;
  onMobileClose?: () => void;
}

export const CourseSidebar = ({
  course,
  lessons,
  modules = [],
  completedLessonIds,
  currentLessonId,
  progressPercent,
  onMobileClose,
}: CourseSidebarProps) => {
  const location = useLocation();

  // Group lessons by module; fall back to chapterTitle grouping when no modules exist
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);
  const lessonsByModuleId = new Map<string, Lesson[]>();
  const orphanLessons: Lesson[] = [];

  for (const lesson of [...lessons].sort((a, b) => a.order - b.order)) {
    if (lesson.moduleId && sortedModules.some((m) => m.id === lesson.moduleId)) {
      const arr = lessonsByModuleId.get(lesson.moduleId) || [];
      arr.push(lesson);
      lessonsByModuleId.set(lesson.moduleId, arr);
    } else {
      orphanLessons.push(lesson);
    }
  }

  // Build display groups: each module becomes a group, orphans in an "Ungrouped" section
  const groups: { key: string; title: string; lessons: Lesson[] }[] = [];

  if (sortedModules.length > 0) {
    for (const mod of sortedModules) {
      groups.push({ key: mod.id, title: mod.title, lessons: lessonsByModuleId.get(mod.id) || [] });
    }
    if (orphanLessons.length > 0) {
      groups.push({ key: "__ungrouped__", title: "Other", lessons: orphanLessons });
    }
  } else {
    // No modules — show all lessons in one flat group
    groups.push({ key: "__all__", title: "Lessons", lessons: [...lessons].sort((a, b) => a.order - b.order) });
  }

  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(groups.map((g) => g.key))
  );

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
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
          {groups.map((group) => (
            <Collapsible
              key={group.key}
              open={openGroups.has(group.key)}
              onOpenChange={() => toggleGroup(group.key)}
            >
              <CollapsibleTrigger className="flex items-center w-full px-2 py-2 text-sm font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors">
                {openGroups.has(group.key) ? (
                  <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                )}
                {group.title}
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <ul className="ml-2 space-y-0.5">
                  {group.lessons.map((lesson) => {
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
