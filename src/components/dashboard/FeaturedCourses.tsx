import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { courses } from "@/data/coursesData";
import { getCourseVisualSettings } from "@/lib/courses/coursesStore";
import { getControlCentreSettings } from "@/lib/controlCentre/controlCentreStore";

/**
 * Featured Courses Component
 *
 * Shows 2 featured courses chosen via Admin > Content > Control Centre Settings.
 * Reads selection + optional overrides from localStorage controlCentreStore.
 * Falls back to course visual settings for thumbnails.
 */

export const FeaturedCourses = () => {
  const settings = getControlCentreSettings();
  const featured = settings.featuredSlots
    .map((slot, i) => {
      const course = courses.find((c) => c.id === slot.courseId);
      if (!course) return null;
      return { course, slot, i };
    })
    .filter(Boolean) as { course: (typeof courses)[number]; slot: (typeof settings.featuredSlots)[number]; i: number }[];

  if (featured.length === 0) return null;

  return (
    <section className="mb-0">
      <h2 className="text-[16px] font-bold text-[#111827] uppercase tracking-[0.04em] mb-3">
        Featured Courses
      </h2>
      <div className="h-px w-full bg-[#1F2937]/50 mb-5" />

      {/* Course grid - 60/40 asymmetry on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {featured.map(({ course, slot, i }) => {
          const vs = getCourseVisualSettings(course.id);
          const thumb = slot.thumbnailOverride || vs.thumbnailUrl || null;
          const cardTitle = slot.titleOverride || vs.cardTitle || course.title;
          const cardDesc = slot.descriptionOverride || course.description;

          const colSpan = i === 0 ? "md:col-span-3" : "md:col-span-2";
          const isSecondary = i === 1;

          return (
            <Link
              key={course.id}
              to={course.href}
              className={`group block bg-white border border-[#E5E7EB] rounded-lg overflow-hidden hover:border-[#D1D5DB] hover:shadow-sm transition-all ${colSpan}`}
            >
              {/* Thumbnail — 16:9 to match YouTube thumbnail format (1280×720) */}
              <div className="relative aspect-video bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 overflow-hidden">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={cardTitle}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                      <BookOpen className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Divider between thumbnail and text — secondary card only */}
              {isSecondary && <div className="h-px w-full bg-[#E5E7EB]" />}

              {/* Content */}
              <div className={isSecondary ? "px-3 py-1.5" : "px-3 py-2"}>
                {isSecondary && (
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-0.5">
                    Course
                  </span>
                )}
                <h3 className={`${isSecondary ? "text-[15px] font-bold" : "text-[14px] font-semibold"} text-[#111827] group-hover:text-[#2563EB] transition-colors line-clamp-1`}>
                  {cardTitle}
                </h3>
                <p className={`text-[12px] text-[#6B7280] leading-snug ${isSecondary ? "line-clamp-2 mt-px" : "line-clamp-1 mt-0.5"}`}>
                  {cardDesc}
                </p>
                {course.estimatedTime && (
                  <span className={`inline-block text-[11px] text-[#9CA3AF] font-medium ${isSecondary ? "mt-px" : "mt-0.5"}`}>
                    {course.estimatedTime}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
