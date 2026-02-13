import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { courses } from "@/data/coursesData";
import { getCourseVisualSettings } from "@/lib/courses/coursesStore";

/**
 * Featured Courses Component
 *
 * Shows 2 featured courses from the real course catalog on the Control Centre.
 * Reads thumbnails from the courses visual-settings store (admin-uploaded).
 * Links to the actual /learn/courses/:slug pages.
 */

// Pick the first 2 "current" courses from the catalog
const FEATURED_IDS = ["ai-foundations", "prompt-engineering-basics"];

export const FeaturedCourses = () => {
  const featured = FEATURED_IDS
    .map((id) => courses.find((c) => c.id === id))
    .filter(Boolean) as typeof courses;

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
        {featured.map((course) => {
          const vs = getCourseVisualSettings(course.id);
          const thumb = vs.thumbnailUrl || null;
          const cardTitle = vs.cardTitle || course.title;

          return (
            <Link
              key={course.id}
              to={course.href}
              className="group block bg-white border border-[#E5E7EB] rounded-lg overflow-hidden hover:border-[#D1D5DB] hover:shadow-sm transition-all"
            >
              {/* Thumbnail */}
              <div className="relative h-32 bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 overflow-hidden">
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
              <div className="p-4">
                <h3 className="text-[15px] font-semibold text-[#111827] mb-1 group-hover:text-[#2563EB] transition-colors line-clamp-1">
                  {cardTitle}
                </h3>
                <p className="text-[13px] text-[#6B7280] leading-relaxed line-clamp-2 mb-2">
                  {course.description}
                </p>
                {course.estimatedTime && (
                  <span className="inline-block text-[11px] text-[#9CA3AF] font-medium">
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
