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
    .map((slot) => {
      const course = courses.find((c) => c.id === slot.courseId);
      if (!course) return null;
      return { course, slot };
    })
    .filter(Boolean) as { course: (typeof courses)[number]; slot: (typeof settings.featuredSlots)[number] }[];

  if (featured.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-bold text-[#111827] uppercase tracking-[0.02em]">
          Featured Courses
        </h2>
      </div>
      <div className="h-px bg-[#E5E7EB] mb-4" />

      {/* Course grid - 2 columns on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featured.map(({ course, slot }) => {
          const vs = getCourseVisualSettings(course.id);
          const thumb = slot.thumbnailOverride || vs.thumbnailUrl || null;
          const cardTitle = slot.titleOverride || vs.cardTitle || course.title;
          const cardDesc = slot.descriptionOverride || course.description;

          return (
            <Link
              key={course.id}
              to={course.href}
              className="group block bg-white border border-[#E5E7EB] rounded-lg overflow-hidden hover:border-[#D1D5DB] hover:shadow-sm transition-all"
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

              {/* Content */}
              <div className="px-3 py-2">
                <h3 className="text-[14px] font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                  {cardTitle}
                </h3>
                <p className="text-[12px] text-[#6B7280] leading-snug line-clamp-1 mt-0.5">
                  {cardDesc}
                </p>
                {course.estimatedTime && (
                  <span className="inline-block text-[11px] text-[#9CA3AF] font-medium mt-0.5">
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
