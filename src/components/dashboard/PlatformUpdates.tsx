import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Wrench, ChevronRight } from "lucide-react";
import { getCourses } from "@/lib/courses";
import type { Course } from "@/lib/courses/types";

interface UpdateItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  href: string;
}

export const PlatformUpdates = () => {
  const [items, setItems] = useState<UpdateItem[]>([]);

  useEffect(() => {
    const updates: UpdateItem[] = [];

    const courses = getCourses().filter(
      (c: Course) => c.lifecycleState === "current" && c.lastUpdated
    );
    if (courses.length > 0) {
      const sorted = [...courses].sort(
        (a: Course, b: Course) =>
          new Date(b.lastUpdated || 0).getTime() -
          new Date(a.lastUpdated || 0).getTime()
      );
      const latest = sorted[0];
      updates.push({
        icon: BookOpen,
        label: "Updated",
        title: latest.title,
        href: `/learn/courses/${latest.slug}`,
      });
    }

    if (courses.length > 0) {
      updates.push({
        icon: Wrench,
        label: "New",
        title: "Tools Directory — latest additions",
        href: "/tools/directory",
      });
    }

    setItems(updates.slice(0, 3));
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mt-4">
      <div className="h-px bg-[#E5E7EB] mb-3" />
      <h2 className="text-[14px] font-bold uppercase tracking-[0.02em] text-[#111827] mb-2">
        Platform Updates
      </h2>
      <div className="h-px bg-[#E5E7EB]" />
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.href}
          className="group flex items-center gap-2.5 h-8 border-t border-[#F3F4F6] first:border-t-0 hover:bg-[#F9FAFB] transition-colors duration-75 px-0.5"
        >
          <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider w-[48px] flex-shrink-0 font-mono">
            {item.label}
          </span>
          <span className="text-[13px] font-medium text-[#1F2937] truncate flex-1 group-hover:underline underline-offset-2">
            {item.title}
          </span>
          <ChevronRight className="h-3 w-3 text-[#D1D5DB] group-hover:text-[#6B7280] transition-colors flex-shrink-0" />
        </Link>
      ))}
    </section>
  );
};
