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
      <section className="mt-4">
        <div className="h-px bg-[#E5E7EB] mb-3" />
        <h2 className="text-[16px] font-bold uppercase tracking-[0.02em] text-[#111827] mb-2">
          Your Focus
        </h2>
        <div className="h-px bg-[#E5E7EB] mb-2.5" />
        <div className="h-[48px] flex items-center justify-center">
          <Loader2 className="h-3 w-3 text-[#9CA3AF] animate-spin" />
        </div>
      </section>
    );
  }

  // Active course with progress
  if (activeProgress) {
    const isComplete = activeProgress.percent === 100;

    return (
      <section className="mt-4">
        <div className="h-px bg-[#E5E7EB] mb-3" />
        <h2 className="text-[16px] font-bold uppercase tracking-[0.02em] text-[#111827] mb-2">
          Your Focus
        </h2>
        <div className="h-px bg-[#E5E7EB] mb-2.5" />
        <div className="flex items-center gap-3 py-1">
          <div className="w-6 h-6 rounded bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
            <Play className="h-2.5 w-2.5 text-[#2563EB]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-[#1F2937] leading-tight truncate">
                {activeProgress.courseTitle}
              </h3>
              <span className="text-[11px] font-semibold text-[#6B7280] tabular-nums flex-shrink-0">
                {activeProgress.percent}%
              </span>
            </div>
            <Progress value={activeProgress.percent} className="h-0.5 mt-1" />
          </div>
          {activeProgress.nextLessonHref ? (
            <Link
              to={activeProgress.nextLessonHref}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-[#2563EB] border border-[#2563EB]/20 hover:bg-[#2563EB]/5 transition-colors flex-shrink-0"
            >
              Resume
              <ArrowRight className="h-2 w-2" />
            </Link>
          ) : (
            <Link
              to={`/learn/courses/${activeProgress.courseSlug}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-[#2563EB] border border-[#2563EB]/20 hover:bg-[#2563EB]/5 transition-colors flex-shrink-0"
            >
              {isComplete ? "Review" : "View"}
              <ArrowRight className="h-2 w-2" />
            </Link>
          )}
        </div>
      </section>
    );
  }

  // No progress — recommend default course
  return (
    <section className="mt-4">
      <div className="h-px bg-[#E5E7EB] mb-3" />
      <h2 className="text-[16px] font-bold uppercase tracking-[0.02em] text-[#111827] mb-2">
        Your Focus
      </h2>
      <div className="h-px bg-[#E5E7EB] mb-2.5" />
      <div className="flex items-center gap-3 py-1">
        <div className="w-6 h-6 rounded bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-2.5 w-2.5 text-[#2563EB]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-[#2563EB]/60 uppercase tracking-[0.1em] mb-0">
            Recommended
          </p>
          <h3 className="text-[13px] font-semibold text-[#1F2937] leading-tight truncate">
            {DEFAULT_COURSE_TITLE}
          </h3>
        </div>
        <Link
          to={`/learn/courses/${DEFAULT_COURSE_SLUG}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-[#2563EB] border border-[#2563EB]/20 hover:bg-[#2563EB]/5 transition-colors flex-shrink-0"
        >
          Begin
          <ArrowRight className="h-2 w-2" />
        </Link>
      </div>
    </section>
  );
};
