import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { courses } from "@/data/coursesData";
import { getCourseVisualSettings } from "@/lib/courses/coursesStore";
import { getControlCentreSettings } from "@/lib/controlCentre/controlCentreStore";

/**
 * Featured Courses — 60 / 40 editorial grid.
 *
 * Slot 1: Flagship hero (60% left column)
 * Slots 2 & 3: Compact stacked tiles (40% right column)
 *
 * Admin configures all 3 via Control Centre Settings.
 * Empty slots (courseId === "") are hidden.
 */

/* ── Thumbnail block (shared) ── */
const Thumbnail = ({ src, alt }: { src: string | null; alt: string }) => (
  <div className="relative aspect-video bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 overflow-hidden rounded-xl">
    {src ? (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-300"
      />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/90 rounded-full p-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
          <BookOpen className="h-5 w-5" />
        </div>
      </div>
    )}
  </div>
);

export const FeaturedCourses = () => {
  const settings = getControlCentreSettings();

  // Resolve each slot
  const resolved = settings.featuredSlots.map((slot) => {
    const course = slot.courseId ? courses.find((c) => c.id === slot.courseId) : null;
    if (!course) return null;
    const vs = getCourseVisualSettings(course.id);
    return {
      course,
      thumb: slot.thumbnailOverride || vs.thumbnailUrl || null,
      title: slot.titleOverride || vs.cardTitle || course.title,
      desc: slot.descriptionOverride || course.description,
    };
  });

  const hero = resolved[0];
  const compact = [resolved[1], resolved[2]].filter(Boolean) as NonNullable<(typeof resolved)[number]>[];

  if (!hero && compact.length === 0) return null;

  return (
    <section className="mb-0">
      <h2 className="text-[16px] font-bold text-[#111827] uppercase tracking-[0.04em] mb-3">
        Featured Courses
      </h2>
      <div className="h-px w-full bg-[#1F2937]/50 mb-5" />

      {/* 60 / 40 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─ Slot 1: Hero (60%) ─ */}
        {hero && (
          <Link
            to={hero.course.href}
            className="group block lg:col-span-3 overflow-hidden hover:opacity-[0.97] transition-opacity"
          >
            <Thumbnail src={hero.thumb} alt={hero.title} />
            <div className="pt-2.5">
              <h3 className="text-[18px] font-semibold text-[#111827] leading-tight group-hover:underline underline-offset-2 decoration-[#111827]/30 line-clamp-1">
                {hero.title}
              </h3>
              <p className="text-[13px] text-[#6B7280] leading-snug mt-0.5 line-clamp-1">
                {hero.desc}
              </p>
              {hero.course.estimatedTime && (
                <span className="inline-block text-[11px] text-[#9CA3AF] font-medium mt-0.5">
                  {hero.course.estimatedTime}
                </span>
              )}
            </div>
          </Link>
        )}

        {/* ─ Slots 2 & 3: Compact stacked (40%) ─ */}
        {compact.length > 0 && (
          <div className="lg:col-span-2 flex flex-col gap-6">
            {compact.map((item) => (
              <Link
                key={item.course.id}
                to={item.course.href}
                className="group block overflow-hidden hover:opacity-[0.97] transition-opacity"
              >
                <Thumbnail src={item.thumb} alt={item.title} />
                <div className="pt-2">
                  <h3 className="text-[14px] font-semibold text-[#111827] leading-tight group-hover:underline underline-offset-2 decoration-[#111827]/30 line-clamp-1">
                    {item.title}
                  </h3>
                  {item.course.estimatedTime && (
                    <span className="inline-block text-[11px] text-[#9CA3AF] font-medium mt-px">
                      {item.course.estimatedTime}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
