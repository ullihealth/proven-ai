import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

/**
 * Featured Courses Component
 * 
 * Shows 2 featured courses (configurable) for the Control Centre main column.
 * These are INTERNAL links to courses within Proven AI, NOT external content.
 */

interface FeaturedCourse {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  href: string;
  duration?: string;
}

// Mock data - in production this would come from API/database
const FEATURED_COURSES: FeaturedCourse[] = [
  {
    id: "ai-fundamentals",
    title: "AI Fundamentals",
    description: "Master the core concepts of artificial intelligence and machine learning.",
    thumbnail: "/placeholder.svg",
    href: "/courses/ai-fundamentals",
    duration: "4h 30m",
  },
  {
    id: "prompt-engineering",
    title: "Prompt Engineering Mastery",
    description: "Learn to craft effective prompts for maximum AI performance.",
    thumbnail: "/placeholder.svg",
    href: "/courses/prompt-engineering",
    duration: "2h 15m",
  },
];

export const FeaturedCourses = () => {
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
        {FEATURED_COURSES.map((course) => (
          <Link
            key={course.id}
            to={course.href}
            className="group block bg-white border border-[#E5E7EB] rounded-lg overflow-hidden hover:border-[#D1D5DB] hover:shadow-sm transition-all"
          >
            {/* Thumbnail */}
            <div className="relative h-32 bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 overflow-hidden">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-[15px] font-semibold text-[#111827] mb-1 group-hover:text-[#2563EB] transition-colors line-clamp-1">
                {course.title}
              </h3>
              <p className="text-[13px] text-[#6B7280] leading-relaxed line-clamp-2 mb-2">
                {course.description}
              </p>
              {course.duration && (
                <span className="inline-block text-[11px] text-[#9CA3AF] font-medium">
                  {course.duration}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
