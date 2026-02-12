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
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-2">
        Platform Updates
      </h2>
      <div className="h-px bg-[#E5E7EB]" />
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.href}
          className="group flex items-center gap-3 h-12 border-t border-[#E5E7EB] first:border-t-0 hover:bg-[#F9FAFB] transition-colors duration-100 px-1"
        >
          <item.icon className="h-4 w-4 text-[#6B7280] group-hover:text-[#2563EB] transition-colors flex-shrink-0" />
          <span className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide w-[56px] flex-shrink-0">
            {item.label}
          </span>
          <span className="text-[14px] font-medium text-[#1F2937] truncate flex-1 group-hover:underline underline-offset-2">
            {item.title}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-[#6B7280] group-hover:text-[#111827] transition-colors flex-shrink-0" />
        </Link>
      ))}
    </section>
  );
};
