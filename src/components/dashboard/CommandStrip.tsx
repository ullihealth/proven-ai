import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCourses } from "@/lib/courses";
import {
  getAllUserProgress,
  getNextAvailableLesson,
  initProgressStore,
} from "@/lib/courses/progressStore";
import { initLessonStore } from "@/lib/courses/lessonStore";
import { useBriefingItems, formatRelativeDate } from "@/components/briefing/IntelligenceBriefing";
import type { CourseProgress } from "@/lib/courses/lessonTypes";

const DEFAULT_COURSE_SLUG = "ai-foundations";
const DEFAULT_COURSE_TITLE = "AI Foundations";

export const CommandStrip = () => {
  const [courseAction, setCourseAction] = useState<{
    label: string;
    href: string;
  } | null>(null);

  const { items } = useBriefingItems(12);

  // Count items fetched today
  const todayCount = items.filter((i) => {
    try {
      const d = new Date(i.fetchedAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    } catch {
      return false;
    }
  }).length;

  const lastUpdated = items.length > 0 ? formatRelativeDate(items[0].fetchedAt) : null;
  const activeSources = new Set(items.map((i) => i.sourceName)).size;

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([initProgressStore(), initLessonStore()]);
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
    <div className="h-14 bg-transparent border-b border-[#E5E7EB] flex items-center justify-between px-6 -mx-6 sm:-mx-6 lg:-mx-8 mb-0">
      {/* LEFT — Primary Action */}
      <div className="flex items-center gap-3 min-w-0">
        {courseAction && (
          <Link
            to={courseAction.href}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1D4ED8] transition-colors truncate max-w-[280px]"
          >
            {courseAction.label}
            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
          </Link>
        )}
      </div>

      {/* CENTER — Intelligence Status */}
      <div className="hidden sm:flex items-center gap-4 text-[14px] font-medium text-[#374151] tabular-nums">
        <span>
          {todayCount} signal{todayCount !== 1 ? "s" : ""} today
        </span>
        {lastUpdated && (
          <span className="text-[#6B7280]">
            Updated {lastUpdated}
          </span>
        )}
      </div>

      {/* RIGHT — System Status */}
      <div className="hidden md:flex items-center gap-4 text-[14px] font-medium text-[#6B7280] tabular-nums">
        <span>Auto-refresh: 6h</span>
        <span>Feeds active: {activeSources || "—"}</span>
      </div>
    </div>
  );
};
