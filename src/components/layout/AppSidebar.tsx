import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Compass,
  HelpCircle,
  BookOpen,
  BookText,
  Calendar,
  Wrench,
  GraduationCap,
  LifeBuoy,
  Users,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  MessageSquare,
  FolderOpen,
  Sparkles,
  Target,
  Lightbulb,
  TrendingUp,
  Clock,
  Eye,
  Grid3X3,
  Plus,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navigation: NavGroup[] = [
  {
    label: "Start Here",
    defaultOpen: true,
    items: [
      { title: "Orientation", href: "/orientation", icon: Compass },
      { title: "How Proven AI Works", href: "/how-it-works", icon: Play },
      { title: "Free vs Paid", href: "/free-vs-paid", icon: HelpCircle },
    ],
  },
  {
    label: "AI Glossary",
    defaultOpen: true,
    items: [
      { title: "Definitions", href: "/glossary", icon: BookText },
    ],
  },
  {
    label: "Core Tools",
    defaultOpen: true,
    items: [
      { title: "All Core Tools", href: "/tools", icon: FolderOpen },
    ],
  },
  {
    label: "Tools Directory",
    defaultOpen: false,
    items: [
      { title: "Browse All Tools", href: "/tools", icon: Grid3X3 },
      { title: "Add Tool", href: "/admin/add-tool", icon: Plus },
      { title: "Review Queue", href: "/admin/review-queue", icon: ListChecks },
    ],
  },
  {
    label: "Daily Flow",
    defaultOpen: false,
    items: [
      { title: "Monday – Foundations", href: "/daily/monday", icon: Target },
      { title: "Tuesday – Tools & Tips", href: "/daily/tuesday", icon: Wrench },
      { title: "Wednesday – Work & Wealth", href: "/daily/wednesday", icon: TrendingUp },
      { title: "Thursday – What's Changing", href: "/daily/thursday", icon: Eye },
      { title: "Friday – Flexible / Insight", href: "/daily/friday", icon: Lightbulb },
    ],
  },
  {
    label: "Learn",
    defaultOpen: false,
    items: [
      { title: "Free Courses", href: "/learn/courses", icon: BookOpen },
      { title: "Guides", href: "/learn/guides", icon: FileText },
      { title: "Prompts", href: "/learn/prompts", icon: MessageSquare },
      { title: "Tools", href: "/learn/tools", icon: Wrench },
    ],
  },
  {
    label: "Go Deeper",
    defaultOpen: false,
    items: [
      { title: "Paid Courses", href: "/courses/paid", icon: GraduationCap },
    ],
  },
  {
    label: "Support",
    defaultOpen: false,
    items: [
      { title: "Get Help", href: "/support", icon: LifeBuoy },
      { title: "Community", href: "https://community.provenai.com", icon: Users, external: true },
    ],
  },
];

interface NavGroupComponentProps {
  group: NavGroup;
  currentPath: string;
}

const NavGroupComponent = ({ group, currentPath }: NavGroupComponentProps) => {
  const isGroupActive = group.items.some(item => currentPath.startsWith(item.href));
  const [isOpen, setIsOpen] = useState(group.defaultOpen || isGroupActive);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[hsl(220,13%,91%)] hover:text-white transition-colors"
      >
        <span>{group.label}</span>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      
      {isOpen && (
        <nav className="mt-1 space-y-0.5">
          {group.items.map((item) => {
            const isActive = currentPath === item.href || 
              (item.href !== "/" && currentPath.startsWith(item.href));
            const Icon = item.icon;

            if (item.external) {
              return (
                <a
                  key={item.title}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-[hsl(215,20%,82%)] hover:bg-white/5 hover:text-white"
                >
                  {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-[hsl(215,16%,65%)]" />}
                  <span className="truncate">{item.title}</span>
                </a>
              );
            }

            return (
              <Link
                key={item.title}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm transition-all relative",
                  isActive
                    ? "bg-[hsl(217,91%,60%,0.15)] text-white font-medium border-l-4 border-l-[hsl(217,91%,60%)] rounded-r-lg ml-0 pl-[calc(0.75rem-4px)]"
                    : "text-[hsl(215,20%,82%)] hover:bg-white/5 hover:text-white rounded-lg border-l-4 border-transparent"
                )}
              >
                {Icon && <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[hsl(217,91%,60%)]" : "text-[hsl(215,16%,65%)]")} />}
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export const AppSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[hsl(222,40%,18%)] bg-[hsl(222,47%,11%)] overflow-hidden flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[hsl(222,40%,18%)]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold text-white">Proven AI</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {navigation.map((group) => (
          <NavGroupComponent
            key={group.label}
            group={group}
            currentPath={currentPath}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[hsl(222,40%,18%)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[hsl(222,35%,20%)] flex items-center justify-center">
            <span className="text-xs font-medium text-[hsl(215,20%,82%)]">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">John Doe</p>
            <p className="text-xs text-[hsl(215,16%,65%)] truncate">Free Member</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
