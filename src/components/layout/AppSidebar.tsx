import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Compass,
  HelpCircle,
  BookOpen,
  BookText,
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
  Eye,
  Grid3X3,
  LogIn,
  LogOut,
  Shield,
  LayoutDashboard,
  Plus,
  ListChecks,
  Scale,
  ClipboardCheck,
  Clock,
  ScrollText,
  UserCircle,
  KeyRound,
  UsersRound,
  Lock,
  BarChart3,
  Plug,
  Terminal,
  Code,
  Palette,
  DollarSign,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useSidebarGroupState } from "@/hooks/use-sidebar-state";

const SIDEBAR_SCROLL_KEY = "sidebarScrollTop";

interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

interface NavSubGroup {
  label: string;
  items: NavItem[];
}

interface NavGroup {
  label: string;
  items?: NavItem[];
  subGroups?: NavSubGroup[];
  defaultOpen?: boolean;
  adminOnly?: boolean;
}

const publicNavigation: NavGroup[] = [
  {
    label: "Start Here",
    defaultOpen: true,
    items: [
      { title: "What is Proven AI?", href: "/orientation", icon: Compass },
      { title: "How Proven AI Works", href: "/how-it-works", icon: Play },
      { title: "What's Included", href: "/free-vs-paid", icon: HelpCircle },
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
      { title: "Core Tools", href: "/core-tools", icon: Sparkles },
    ],
  },
  {
    label: "Tools Directory",
    defaultOpen: false,
    items: [
      { title: "Browse All Tools", href: "/tools/directory", icon: Grid3X3 },
    ],
  },
  {
    label: "Daily Flow",
    defaultOpen: false,
    items: [
      { title: "Monday – Foundations", href: "/daily/monday", icon: Target },
      { title: "Tuesday – Tools & Tips", href: "/daily/tuesday", icon: Wrench },
      { title: "Wednesday – Work & Wealth", href: "/daily/wednesday", icon: TrendingUp },
      { title: "Thursday – AI News & Updates", href: "/daily/thursday", icon: Eye },
      { title: "Friday – Feedback & Questions", href: "/daily/friday", icon: Lightbulb },
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

const adminNavigation: NavGroup = {
  label: "Admin Console",
  defaultOpen: false,
  adminOnly: true,
  subGroups: [
    {
      label: "",
      items: [
        { title: "Overview", href: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      label: "Tools",
      items: [
        { title: "Add Tool", href: "/admin/tools/add", icon: Plus },
        { title: "Review Queue", href: "/admin/tools/review-queue", icon: ListChecks },
        { title: "Customize Cards", href: "/admin/tools/customize", icon: Palette },
      ],
    },
    {
      label: "Content",
      items: [
        { title: "Daily Flow Posts", href: "/admin/content/daily-flow", icon: Video },
        { title: "Courses", href: "/admin/content/courses", icon: BookOpen },
        { title: "Lessons", href: "/admin/content/lessons", icon: BookText },
        { title: "Guides", href: "/admin/content/guides", icon: FileText },
      ],
    },
    {
      label: "Governance",
      items: [
        { title: "Trust Ladder Rules", href: "/admin/governance/trust-ladder", icon: Scale },
        { title: "Review Checklist", href: "/admin/governance/review-checklist", icon: ClipboardCheck },
        { title: "Status & Expiry Rules", href: "/admin/governance/status-expiry", icon: Clock },
        { title: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
      ],
    },
    {
      label: "Members",
      items: [
        { title: "Member Profiles", href: "/admin/members/profiles", icon: UserCircle },
        { title: "Access & Roles", href: "/admin/members/roles", icon: KeyRound },
      ],
    },
    {
      label: "Team",
      items: [
        { title: "Team Members", href: "/admin/team/members", icon: UsersRound },
        { title: "Permissions", href: "/admin/team/permissions", icon: Lock },
      ],
    },
    {
      label: "",
      items: [
        { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { title: "Integrations & APIs", href: "/admin/integrations", icon: Plug },
      ],
    },
    {
      label: "System",
      items: [
        { title: "App Logs", href: "/admin/system/logs", icon: Terminal },
        { title: "Developer Settings", href: "/admin/system/developer", icon: Code },
        { title: "App Customisation", href: "/admin/system/customisation", icon: Palette },
      ],
    },
    {
      label: "",
      items: [
        { title: "Finance", href: "/admin/finance", icon: DollarSign },
      ],
    },
  ],
};

interface NavItemComponentProps {
  item: NavItem;
  currentPath: string;
  compact?: boolean;
}

const NavItemComponent = ({ item, currentPath, compact }: NavItemComponentProps) => {
  const isActive = currentPath === item.href || 
    (item.href !== "/" && item.href !== "/admin" && currentPath.startsWith(item.href));
  const Icon = item.icon;

  if (item.external) {
    return (
      <a
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
      to={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-sm transition-all relative",
        isActive
          ? "bg-[hsl(217,91%,60%,0.15)] text-white font-medium border-l-4 border-l-[hsl(217,91%,60%)] rounded-r-lg ml-0 pl-[calc(0.75rem-4px)]"
          : "text-[hsl(215,20%,82%)] hover:bg-white/5 hover:text-white rounded-lg border-l-4 border-transparent",
        compact && "py-2"
      )}
    >
      {Icon && <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[hsl(217,91%,60%)]" : "text-[hsl(215,16%,65%)]")} />}
      <span className="truncate">{item.title}</span>
    </Link>
  );
};

interface NavGroupComponentProps {
  group: NavGroup;
  currentPath: string;
  isOpen: boolean;
  onToggle: () => void;
}

const NavGroupComponent = ({ group, currentPath, isOpen, onToggle }: NavGroupComponentProps) => {
  const getSubGroupKey = (subGroup: NavSubGroup, idx: number) =>
    subGroup.label ? subGroup.label : `__ungrouped_${idx}`;

  const isSubGroupActive = (subGroup: NavSubGroup) =>
    subGroup.items.some(item =>
      currentPath === item.href || (item.href !== "/" && item.href !== "/admin" && currentPath.startsWith(item.href))
    );

  const [openSubGroups, setOpenSubGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    group.subGroups?.forEach((subGroup, idx) => {
      if (!subGroup.label) return;
      const key = getSubGroupKey(subGroup, idx);
      initial[key] = isSubGroupActive(subGroup);
    });
    return initial;
  });

  useEffect(() => {
    if (!group.subGroups) return;
    setOpenSubGroups(() => {
      const next: Record<string, boolean> = {};
      let activeKey: string | null = null;
      group.subGroups.forEach((subGroup, idx) => {
        if (!subGroup.label) return;
        const key = getSubGroupKey(subGroup, idx);
        if (isSubGroupActive(subGroup)) {
          activeKey = key;
        }
        next[key] = false;
      });
      if (activeKey) {
        next[activeKey] = true;
      }
      return next;
    });
  }, [currentPath, group.subGroups]);
  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
          group.adminOnly 
            ? "text-primary hover:text-primary/80" 
            : "text-[hsl(220,13%,91%)] hover:text-white"
        )}
      >
        <span className="flex items-center gap-2">
          {group.adminOnly && <Shield className="h-3.5 w-3.5" />}
          {group.label}
        </span>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      
      {isOpen && (
        <nav className="mt-1 space-y-0.5">
          {group.items?.map((item) => (
            <NavItemComponent key={item.href} item={item} currentPath={currentPath} />
          ))}
          
          {group.subGroups?.map((subGroup, idx) => {
            const hasLabel = Boolean(subGroup.label);
            const key = getSubGroupKey(subGroup, idx);
            const isSubGroupOpen = hasLabel ? openSubGroups[key] : true;

            return (
              <div key={key} className={cn(hasLabel && "mt-3")}>
                {hasLabel && (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSubGroups((prev) => {
                        const next: Record<string, boolean> = {};
                        Object.keys(prev).forEach((existingKey) => {
                          next[existingKey] = false;
                        });
                        next[key] = !prev[key];
                        return next;
                      })
                    }
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(215,16%,50%)] hover:text-[hsl(215,20%,75%)]"
                  >
                    <span>{subGroup.label}</span>
                    {isSubGroupOpen ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                )}
                {isSubGroupOpen && (
                  <div className="space-y-0.5">
                    {subGroup.items.map((item) => (
                      <NavItemComponent key={item.href} item={item} currentPath={currentPath} compact />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      )}
    </div>
  );
};

const isGroupActiveForPath = (group: NavGroup, currentPath: string): boolean => {
  return group.items?.some(item => 
    currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href))
  ) || group.subGroups?.some(sg => 
    sg.items.some(item => currentPath === item.href || (item.href !== "/" && item.href !== "/admin" && currentPath.startsWith(item.href)))
  ) || false;
};

export const AppSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, isAuthenticated, isAdmin, signOut, isLoading } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isGroupOpen, toggleGroup } = useSidebarGroupState(isAdmin);

  // Restore scroll position on mount
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
    if (scrollRef.current && savedScroll) {
      scrollRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  // Save scroll position on scroll
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      sessionStorage.setItem(SIDEBAR_SCROLL_KEY, element.scrollTop.toString());
    };

    element.addEventListener("scroll", handleScroll);
    return () => element.removeEventListener("scroll", handleScroll);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] overflow-hidden flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-[hsl(var(--sidebar-border))]">
        <img src="/proven-ai-logo-4.png" alt="Proven AI" className="h-9 w-auto" />
      </div>

      {/* Navigation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        {publicNavigation.map((group) => {
          const isActive = isGroupActiveForPath(group, currentPath);
          return (
            <NavGroupComponent
              key={group.label}
              group={group}
              currentPath={currentPath}
              isOpen={isGroupOpen(group.label, isActive)}
              onToggle={() => toggleGroup(group.label, isActive)}
            />
          );
        })}
        
        {/* Admin Console - only visible to admins */}
        {isAdmin && (() => {
          const isActive = isGroupActiveForPath(adminNavigation, currentPath);
          return (
            <NavGroupComponent
              group={adminNavigation}
              currentPath={currentPath}
              isOpen={isGroupOpen(adminNavigation.label, isActive)}
              onToggle={() => toggleGroup(adminNavigation.label, isActive)}
            />
          );
        })()}
      </div>

      {/* Footer - Auth Section */}
      <div className="px-4 py-4 border-t border-[hsl(var(--sidebar-border))]">
        {isLoading ? (
          <div className="h-10 bg-[hsl(222,35%,20%)] rounded-lg animate-pulse" />
        ) : isAuthenticated ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                <p className="text-xs text-[hsl(215,16%,65%)] truncate">{user?.email}</p>
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-1.5 px-1">
                <Shield className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">Admin</span>
              </div>
            )}
            
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-[hsl(215,20%,82%)] hover:bg-white/5 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
};
