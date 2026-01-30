import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Compass,
  HelpCircle,
  BookOpen,
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
    label: "Daily Flow",
    defaultOpen: true,
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
    defaultOpen: true,
    items: [
      { title: "Free Courses", href: "/learn/courses", icon: BookOpen },
      { title: "Guides", href: "/learn/guides", icon: FileText },
      { title: "Prompts", href: "/learn/prompts", icon: MessageSquare },
      { title: "Tools", href: "/learn/tools", icon: Wrench },
    ],
  },
  {
    label: "Tools",
    defaultOpen: false,
    items: [
      { title: "Tools Directory", href: "/tools", icon: FolderOpen },
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
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
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
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                  <span className="truncate">{item.title}</span>
                </a>
              );
            }

            return (
              <Link
                key={item.title}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar overflow-hidden flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">Proven AI</span>
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
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-xs font-medium text-secondary-foreground">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">Free Member</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
