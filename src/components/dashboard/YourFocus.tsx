import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getCourses } from "@/lib/courses";
import {
  getAllUserProgress,
  getCourseCompletionPercent,
  getNextAvailableLesson,
  initProgressStore,
} from "@/lib/courses/progressStore";
import { getLessonsByCourse, initLessonStore } from "@/lib/courses/lessonStore";
import type { CourseProgress } from "@/lib/courses/lessonTypes";

const DEFAULT_COURSE_SLUG = "ai-foundations";
const DEFAULT_COURSE_TITLE = "AI Foundations for Professionals";

export const YourFocus = () => {
  const [loading, setLoading] = useState(true);
  const [activeProgress, setActiveProgress] = useState<{
    courseTitle: string;
    courseSlug: string;
    percent: number;
    nextLessonTitle: string | null;
    nextLessonHref: string | null;
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([initProgressStore(), initLessonStore()]);

        const courses = getCourses();
        const allProgress = getAllUserProgress();

        // Find most recently accessed course with actual progress
        const activeEntry = allProgress
          .filter((p: CourseProgress) => p.completedLessonIds.length > 0)
          .sort(
            (a: CourseProgress, b: CourseProgress) =>
              new Date(b.lastAccessedAt).getTime() -
              new Date(a.lastAccessedAt).getTime()
          )[0];

        if (activeEntry) {
          const course = courses.find((c) => c.id === activeEntry.courseId);
          if (course) {
            const percent = getCourseCompletionPercent(course.id);
            const nextLesson = getNextAvailableLesson(course.id);
            const lessons = getLessonsByCourse(course.id);
            const isComplete = percent === 100;

            setActiveProgress({
              courseTitle: course.title,
              courseSlug: course.slug,
              percent,
              nextLessonTitle:
                isComplete && lessons.length > 0
                  ? null
                  : nextLesson?.title || null,
              nextLessonHref:
                isComplete || !nextLesson
                  ? null
                  : `/learn/courses/${course.slug}/lesson/${nextLesson.id}`,
            });
          }
        }
      } catch {
        // Progress store may not be initialised — show default
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <section>
        <h2 className="text-[13px] font-semibold text-foreground/80 uppercase tracking-wider mb-2.5">
          Your Focus
        </h2>
        <div className="p-6 rounded-lg bg-card/80 border border-border/50 shadow-sm flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-muted-foreground/30 animate-spin" />
        </div>
      </section>
    );
  }

  // Active course with progress
  if (activeProgress) {
    const isComplete = activeProgress.percent === 100;

    return (
      <section>
        <h2 className="text-[13px] font-semibold text-foreground/80 uppercase tracking-wider mb-2.5">
          Your Focus
        </h2>
        <div className="p-4 sm:p-5 rounded-lg bg-card/80 border border-border/50 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Play className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-[0.12em] mb-0.5">
                {isComplete ? "Completed" : "Continue"}
              </p>
              <h3 className="text-[15px] font-semibold text-foreground leading-snug">
                {activeProgress.courseTitle}
              </h3>

              {/* Progress bar */}
              <div className="mt-2.5 mb-2.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 mb-1">
                  <span>Progress</span>
                  <span className="font-medium tabular-nums">
                    {activeProgress.percent}%
                  </span>
                </div>
                <Progress value={activeProgress.percent} className="h-1.5" />
              </div>

              {activeProgress.nextLessonTitle && (
                <p className="text-[12px] text-muted-foreground/50 mb-2.5">
                  Next: {activeProgress.nextLessonTitle}
                </p>
              )}

              {activeProgress.nextLessonHref ? (
                <Link
                  to={activeProgress.nextLessonHref}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors"
                >
                  Resume
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <Link
                  to={`/learn/courses/${activeProgress.courseSlug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors"
                >
                  {isComplete ? "Review Course" : "View Course"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // No progress — recommend default course
  return (
    <section>
      <h2 className="text-[13px] font-semibold text-foreground/80 uppercase tracking-wider mb-2.5">
        Your Focus
      </h2>
      <div className="p-4 sm:p-5 rounded-lg bg-card/80 border border-border/50 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-[0.12em] mb-0.5">
              Recommended
            </p>
            <h3 className="text-[15px] font-semibold text-foreground leading-snug">
              {DEFAULT_COURSE_TITLE}
            </h3>
            <Link
              to={`/learn/courses/${DEFAULT_COURSE_SLUG}`}
              className="inline-flex items-center gap-2 mt-2.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors"
            >
              Begin Course
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
