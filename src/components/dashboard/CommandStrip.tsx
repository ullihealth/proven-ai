import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCourses, loadCourses } from "@/lib/courses";
import {
  getAllUserProgress,
  getNextAvailableLesson,
  initProgressStore,
} from "@/lib/courses/progressStore";
import { loadCourseLessons } from "@/lib/courses/lessonStore";
import type { CourseProgress } from "@/lib/courses/lessonTypes";

const DEFAULT_COURSE_SLUG = "ai-foundations";
const DEFAULT_COURSE_TITLE = "AI Foundations";

export const CommandStrip = () => {
  const [courseAction, setCourseAction] = useState<{
    label: string;
    href: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await initProgressStore();
        await loadCourses();
        const courses = getCourses();
        const allProgress = getAllUserProgress();

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
            await loadCourseLessons(course.id);
            const nextLesson = getNextAvailableLesson(course.id);
            setCourseAction({
              label: `Resume: ${course.title}`,
              href: nextLesson
                ? `/learn/courses/${course.slug}/lesson/${nextLesson.id}`
                : `/learn/courses/${course.slug}`,
            });
            return;
          }
        }

        setCourseAction({
          label: `Start: ${DEFAULT_COURSE_TITLE}`,
          href: `/learn/courses/${DEFAULT_COURSE_SLUG}`,
        });
      } catch {
        setCourseAction({
          label: `Start: ${DEFAULT_COURSE_TITLE}`,
          href: `/learn/courses/${DEFAULT_COURSE_SLUG}`,
        });
      }
    })();
  }, []);

  return (
    <div className="pt-3 mb-1 pb-1 border-b border-[#E5E7EB]">
      {courseAction && (
        <Link
          to={courseAction.href}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1D4ED8] transition-colors truncate max-w-full"
        >
          {courseAction.label}
          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
        </Link>
      )}
    </div>
  );
};
