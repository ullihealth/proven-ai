import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Wrench } from "lucide-react";
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

    // Recently updated course (most recent lastUpdated)
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
        label: "Recently Updated Course",
        title: latest.title,
        href: `/learn/courses/${latest.slug}`,
      });
    }

    // Placeholder: Newly Added Tool — when tools have createdAt we can sort
    // For now, show a static entry only if courses exist (platform is populated)
    if (courses.length > 0) {
      updates.push({
        icon: Wrench,
        label: "Newly Added Tool",
        title: "Browse the latest additions in the Tools Directory",
        href: "/tools/directory",
      });
    }

    setItems(updates);
  }, []);

  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em] mb-3">
        Platform Updates
      </h3>
      <div className="space-y-[12px]">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="group flex items-center gap-3 h-[60px] rounded-md bg-card/40 border border-border/30 px-3.5 hover:border-border/50 transition-colors duration-150"
          >
            <div className="w-8 h-8 rounded-md bg-muted/40 flex items-center justify-center flex-shrink-0">
              <item.icon className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground/35 leading-none mb-0.5">{item.label}</p>
              <p className="text-[13px] font-medium text-foreground truncate group-hover:underline decoration-primary/30 underline-offset-2">
                {item.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
