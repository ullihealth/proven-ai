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
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Your Focus
        </h2>
        <div className="p-8 rounded-xl bg-card border border-border flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
        </div>
      </section>
    );
  }

  // Active course with progress
  if (activeProgress) {
    const isComplete = activeProgress.percent === 100;

    return (
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Your Focus
        </h2>
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                {isComplete ? "Completed" : "Continue"}
              </p>
              <h3 className="text-lg font-semibold text-foreground">
                {activeProgress.courseTitle}
              </h3>

              {/* Progress bar */}
              <div className="mt-3 mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Progress</span>
                  <span className="font-medium">
                    {activeProgress.percent}%
                  </span>
                </div>
                <Progress value={activeProgress.percent} className="h-2" />
              </div>

              {activeProgress.nextLessonTitle && (
                <p className="text-sm text-muted-foreground mb-4">
                  Next: {activeProgress.nextLessonTitle}
                </p>
              )}

              {activeProgress.nextLessonHref ? (
                <Link
                  to={activeProgress.nextLessonHref}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Resume
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to={`/learn/courses/${activeProgress.courseSlug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {isComplete ? "Review Course" : "View Course"}
                  <ArrowRight className="h-4 w-4" />
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
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Your Focus
      </h2>
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
              Recommended
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              {DEFAULT_COURSE_TITLE}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A structured introduction to AI concepts, tools, and practical
              applications — start here to build a strong foundation.
            </p>
            <Link
              to={`/learn/courses/${DEFAULT_COURSE_SLUG}`}
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Begin Course
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
