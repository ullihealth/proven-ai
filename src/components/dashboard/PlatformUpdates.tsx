import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Wrench, Megaphone, ArrowRight } from "lucide-react";
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
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Platform Updates
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="group flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium text-foreground truncate">
                {item.title}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
};
