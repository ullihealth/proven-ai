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
        <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em] mb-2">
          Your Focus
        </h2>
        <div className="h-[120px] rounded-md bg-card/60 border border-border/40 flex items-center justify-center">
          <Loader2 className="h-3.5 w-3.5 text-muted-foreground/30 animate-spin" />
        </div>
      </section>
    );
  }

  // Active course with progress
  if (activeProgress) {
    const isComplete = activeProgress.percent === 100;

    return (
      <section>
        <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em] mb-2">
          Your Focus
        </h2>
        <div className="p-[24px] rounded-md bg-card/60 border border-border/40">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Play className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-[0.12em] mb-0.5">
                {isComplete ? "Completed" : "Continue"}
              </p>
              <h3 className="text-[15px] font-bold text-foreground leading-tight">
                {activeProgress.courseTitle}
              </h3>

              <div className="mt-2 mb-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/40 mb-1">
                  <span>Progress</span>
                  <span className="font-medium tabular-nums">{activeProgress.percent}%</span>
                </div>
                <Progress value={activeProgress.percent} className="h-1" />
              </div>

              {activeProgress.nextLessonTitle && (
                <p className="text-[11px] text-muted-foreground/40 mb-2">
                  Next: {activeProgress.nextLessonTitle}
                </p>
              )}

              {activeProgress.nextLessonHref ? (
                <Link
                  to={activeProgress.nextLessonHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Resume
                  <ArrowRight className="h-2.5 w-2.5" />
                </Link>
              ) : (
                <Link
                  to={`/learn/courses/${activeProgress.courseSlug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {isComplete ? "Review Course" : "View Course"}
                  <ArrowRight className="h-2.5 w-2.5" />
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
      <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em] mb-2">
        Your Focus
      </h2>
      <div className="p-[24px] rounded-md bg-card/60 border border-border/40">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-[0.12em] mb-0.5">
              Recommended
            </p>
            <h3 className="text-[15px] font-bold text-foreground leading-tight">
              {DEFAULT_COURSE_TITLE}
            </h3>
            <Link
              to={`/learn/courses/${DEFAULT_COURSE_SLUG}`}
              className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Begin Course
              <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
