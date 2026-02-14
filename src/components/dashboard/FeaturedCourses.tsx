import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { courses } from "@/data/coursesData";
import { getCourseVisualSettings } from "@/lib/courses/coursesStore";
import { getControlCentreSettings } from "@/lib/controlCentre/controlCentreStore";

/**
 * Featured Courses — 75 / 25 editorial grid.
 *
 * Slot 1: Flagship hero (75 % left column)
 * Slot 2: Compact card (25 % right, top)  — flex-1
 * Slot 3: Compact card (25 % right, bottom) — flex-1
 *
 * Right stack stretches to match hero height so the three cards
 * form a single balanced rectangle. Thumbnails use object-fit: contain.
 */

/* ── Thumbnail (neutral bg + contain — never crops) ── */
const CourseThumb = ({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) => (
  <div
    className={`relative w-full bg-[#F3F4F6] overflow-hidden rounded-lg ${className}`}
    style={{ aspectRatio: "16 / 9" }}
  >
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-contain" />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/90 rounded-full p-3">
          <BookOpen className="h-5 w-5 text-[#6B7280]" />
        </div>
      </div>
    )}
  </div>
);

/* ── Compact right-side card (flex-1 to fill available height) ── */
const CompactCard = ({
  data,
}: {
  data: { course: (typeof courses)[number]; thumb: string | null; title: string };
}) => (
  <Link
    to={data.course.href}
    className="group flex flex-col flex-1 min-h-0 overflow-hidden hover:opacity-[0.97] transition-opacity"
  >
    {/* Thumbnail fills available width; fixed 16:9 ratio */}
    <CourseThumb src={data.thumb} alt={data.title} />

    {/* Title + meta — compact spacing */}
    <div className="pt-1.5 pb-0.5">
      <h3 className="text-[13px] font-semibold text-[#111827] leading-snug group-hover:underline underline-offset-2 decoration-[#111827]/30 line-clamp-1">
        {data.title}
      </h3>
      {data.course.estimatedTime && (
        <span className="inline-block text-[10px] text-[#9CA3AF] font-medium mt-px leading-none">
          {data.course.estimatedTime}
        </span>
      )}
    </div>
  </Link>
);

export const FeaturedCourses = () => {
  const settings = getControlCentreSettings();

  const resolved = settings.featuredSlots.map((slot) => {
    const course = slot.courseId
      ? courses.find((c) => c.id === slot.courseId)
      : null;
    if (!course) return null;
    const vs = getCourseVisualSettings(course.id);
    return {
      course,
      thumb: slot.thumbnailOverride || vs.thumbnailUrl || null,
      title: slot.titleOverride || vs.cardTitle || course.title,
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

      {/* 75 / 25 grid — right stack stretches to match hero height */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_1fr] lg:gap-6">
        {/* ─ Slot 1: Hero (75 %) ─ */}
        {hero && (
          <Link
            to={hero.course.href}
            className="group block overflow-hidden hover:opacity-[0.97] transition-opacity"
          >
            <CourseThumb src={hero.thumb} alt={hero.title} className="rounded-xl" />
            <div className="pt-3">
              <h3 className="text-[18px] font-semibold text-[#111827] leading-tight group-hover:underline underline-offset-2 decoration-[#111827]/30 line-clamp-1">
                {hero.title}
              </h3>
              {hero.course.estimatedTime && (
                <span className="inline-block text-[11px] text-[#9CA3AF] font-medium mt-0.5">
                  {hero.course.estimatedTime}
                </span>
              )}
            </div>
          </Link>
        )}

        {/* ─ Right stack (25 %) — height locked to hero via grid row ─ */}
        {(slot2 || slot3) && (
          <div className="flex flex-col gap-4">
            {slot2 && <CompactCard data={slot2} />}
            {slot3 && <CompactCard data={slot3} />}
          </div>
        )}
      </div>
    </section>
  );
};
