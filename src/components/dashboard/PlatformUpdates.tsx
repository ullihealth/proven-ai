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
    <div>
      <h3 className="text-[13px] font-extrabold text-foreground uppercase tracking-[0.14em] mb-2">
        Platform Updates
      </h3>
      <div className="h-px bg-border/50 mb-1" />
      <div className="divide-y divide-border/20">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="group flex items-center gap-3 h-[42px] hover:bg-muted/10 transition-colors duration-100 px-1"
          >
            <item.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide w-[52px] flex-shrink-0">
              {item.label}
            </span>
            <span className="text-[13px] font-semibold text-foreground truncate flex-1 group-hover:underline decoration-primary/40 underline-offset-2">
              {item.title}
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};
