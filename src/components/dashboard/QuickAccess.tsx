import { Link } from "react-router-dom";
import { Wrench, BookOpen, GraduationCap, ArrowRight } from "lucide-react";

const links = [
  {
    icon: Wrench,
    label: "Core Tools",
    href: "/tools",
  },
  {
    icon: BookOpen,
    label: "AI Glossary",
    href: "/tools/glossary",
  },
  {
    icon: GraduationCap,
    label: "All Courses",
    href: "/learn/courses",
  },
];

export const QuickAccess = () => (
  <div>
    <h3 className="text-[13px] font-semibold text-foreground/80 uppercase tracking-wider mb-3">
      Quick Access
    </h3>
    <div className="space-y-1">
      {links.map((item) => (
        <Link
          key={item.label}
          to={item.href}
          className="group flex items-center gap-2.5 py-2 rounded-md hover:bg-muted/20 -mx-1 px-1 transition-colors duration-150"
        >
          <item.icon className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          <span className="text-[13px] font-medium text-foreground group-hover:underline decoration-primary/30 underline-offset-2">
            {item.label}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      ))}
    </div>
  </div>
);
