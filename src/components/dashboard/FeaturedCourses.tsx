import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { courses } from "@/data/coursesData";
import { getCourseVisualSettings } from "@/lib/courses/coursesStore";
import { getControlCentreSettings } from "@/lib/controlCentre/controlCentreStore";

/**
 * Featured Courses — 60 / 40 editorial grid.
 *
 * Slot 1: Flagship hero (60% left column) — large 16:9 thumb, title, 1-line desc, duration
 * Slot 2: Secondary feature (40% right, top) — 75%-height 16:9 thumb, title only, duration
 * Slot 3: Compact strip (40% right, bottom) — small thumb left, title + duration right
 *
 * Admin configures all 3 via Control Centre Settings.
 * Empty slots (courseId === "") are hidden.
 */

/* ── Thumbnail placeholder ── */
const ThumbPlaceholder = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="bg-white/90 rounded-full p-3">
      <BookOpen className="h-5 w-5 text-[#6B7280]" />
    </div>
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
  const slot2 = resolved[1];
  const slot3 = resolved[2];

  if (!hero && !slot2 && !slot3) return null;

  return (
    <section className="mb-0">
      <h2 className="text-[16px] font-bold text-[#111827] uppercase tracking-[0.04em] mb-3">
        Featured Courses
      </h2>
      <div className="h-px w-full bg-[#1F2937]/50 mb-5" />

      {/* 60 / 40 grid — 24px gap */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─ Slot 1: Flagship hero (60%) ─ */}
        {hero && (
          <Link
            to={hero.course.href}
            className="group block lg:col-span-3 overflow-hidden hover:opacity-[0.97] transition-opacity"
          >
            <div className="relative aspect-video bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 overflow-hidden rounded-xl">
              {hero.thumb ? (
                <img src={hero.thumb} alt={hero.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-300" />
              ) : (
                <ThumbPlaceholder />
              )}
            </div>
            <div className="pt-4">
              <h3 className="text-[20px] font-semibold text-[#111827] leading-tight group-hover:underline underline-offset-2 decoration-[#111827]/30 line-clamp-1">
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

        {/* ─ Right column (40%) ─ */}
        {(slot2 || slot3) && (
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Slot 2: Secondary feature — 75% height thumb */}
            {slot2 && (
              <Link
                to={slot2.course.href}
                className="group block overflow-hidden hover:opacity-[0.97] transition-opacity"
              >
                <div className="relative bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 overflow-hidden rounded-xl" style={{ aspectRatio: "16 / 9" }}>
                  {slot2.thumb ? (
                    <img src={slot2.thumb} alt={slot2.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-300" />
                  ) : (
                    <ThumbPlaceholder />
                  )}
                </div>
                <div className="pt-4">
                  <h3 className="text-[14px] font-semibold text-[#111827] leading-tight group-hover:underline underline-offset-2 decoration-[#111827]/30 line-clamp-1">
                    {slot2.title}
                  </h3>
                  {slot2.course.estimatedTime && (
                    <span className="inline-block text-[11px] text-[#9CA3AF] font-medium mt-px">
                      {slot2.course.estimatedTime}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {/* Slot 3: Compact strip — horizontal, visually lighter */}
            {slot3 && (
              <Link
                to={slot3.course.href}
                className="group flex items-start gap-3 overflow-hidden hover:opacity-[0.97] transition-opacity"
              >
                <div className="relative flex-shrink-0 w-[160px] h-[90px] bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 overflow-hidden rounded-lg">
                  {slot3.thumb ? (
                    <img src={slot3.thumb} alt={slot3.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-200" />
                  ) : (
                    <ThumbPlaceholder />
                  )}
                </div>
                <div className="pt-0.5 min-w-0">
                  <h3 className="text-[13px] font-medium text-[#111827] leading-snug group-hover:underline underline-offset-2 decoration-[#111827]/30 line-clamp-2">
                    {slot3.title}
                  </h3>
                  {slot3.course.estimatedTime && (
                    <span className="inline-block text-[11px] text-[#9CA3AF] font-medium mt-0.5">
                      {slot3.course.estimatedTime}
                    </span>
                  )}
                </div>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
