import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Compass,
  HelpCircle,
  BookOpen,
  BookText,
  Home,
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
  Globe,
  Video,
  Newspaper,
  Rss,
  Megaphone,
  Star,
  ExternalLink,
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
  sectionHeader?: string;
}

const SidebarSectionLabel = ({ label }: { label: string }) => (
  <div className="px-3 pt-6 pb-1">
    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[rgba(255,255,255,.35)]">
      {label}
    </span>
  </div>
);

const publicNavigation: NavGroup[] = [
  {
    label: "Control Centre",
    sectionHeader: "Platform",
    defaultOpen: true,
    items: [
      { title: "Control Centre", href: "/control-centre", icon: Home },
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
    label: "Tools",
    sectionHeader: "Tools & Reference",
    defaultOpen: false,
    items: [
      { title: "Core Tools", href: "/core-tools", icon: Sparkles },
      { title: "Top Picks", href: "/learn/tools", icon: Star },
      { title: "Directory", href: "/tools/directory", icon: Grid3X3 },
      { title: "Reviews", href: "/tools/reviews", icon: Wrench },
    ],
  },
  {
    label: "AI Glossary",
    defaultOpen: false,
    items: [
      { title: "Definitions", href: "/glossary", icon: BookText },
    ],
  },
  {
    label: "Start Here",
    sectionHeader: "Learning",
    defaultOpen: true,
    items: [
      { title: "What is Proven AI?", href: "/orientation", icon: Compass },
      { title: "How Proven AI Works", href: "/how-it-works", icon: Play },
      { title: "What’s Included", href: "/free-vs-paid", icon: HelpCircle },
    ],
  },
  {
    label: "Learn",
    defaultOpen: false,
    items: [
      { title: "Free Courses", href: "/learn/courses", icon: BookOpen },
      { title: "Guides", href: "/learn/guides", icon: FileText },
      { title: "Prompts", href: "/learn/prompts", icon: MessageSquare },
    ],
  },
  {
    label: "Go Deeper",
    defaultOpen: false,
    items: [
      { title: "Advanced Courses", href: "/courses/paid", icon: GraduationCap },
    ],
  },
  {
    label: "Support",
    sectionHeader: "Support",
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
      label: "Briefing",
      items: [
        { title: "Intelligence", href: "/admin/briefing/intelligence", icon: Newspaper },
        { title: "Sources", href: "/admin/briefing/sources", icon: Rss },
      ],
    },
    {
      label: "Content",
      items: [
        { title: "Control Centre", href: "/admin/content/control-centre", icon: Home },
        { title: "Top Topics", href: "/admin/content/editors-picks", icon: Sparkles },
        { title: "Daily Flow Posts", href: "/admin/content/daily-flow", icon: Video },
        { title: "Courses", href: "/admin/content/courses", icon: BookOpen },
        { title: "Lessons", href: "/admin/content/lessons", icon: BookText },
        { title: "Guides", href: "/admin/content/guides", icon: FileText },
        { title: "Platform Updates", href: "/admin/content/platform-updates", icon: Megaphone },
        { title: "Footer", href: "/admin/content/footer", icon: Palette },
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
      label: "People",
      items: [
        { title: "Member Profiles", href: "/admin/members/profiles", icon: UserCircle },
        { title: "Access & Roles", href: "/admin/members/roles", icon: KeyRound },
        { title: "Team Members", href: "/admin/team/members", icon: UsersRound },
        { title: "Permissions", href: "/admin/team/permissions", icon: Lock },
      ],
    },
    {
      label: "Reporting",
      items: [
        { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { title: "Book Signups", href: "/admin/book-signups", icon: BookOpen },
      ],
    },
    {
      label: "System",
      items: [
        { title: "Integrations & APIs", href: "/admin/integrations", icon: Plug },
        { title: "Finance", href: "/admin/finance", icon: DollarSign },
        { title: "Site Mode", href: "/admin/system/site-mode", icon: Globe },
        { title: "App Logs", href: "/admin/system/logs", icon: Terminal },
        { title: "Developer Settings", href: "/admin/system/developer", icon: Code },
        { title: "App Customisation", href: "/admin/system/customisation", icon: Palette },
      ],
    },
    {
      label: "External",
      items: [
        { title: "SaaS Desk", href: "https://saasdesk.dev/", icon: ExternalLink, external: true },
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
        className="flex items-center gap-3 px-3 py-3 rounded-lg text-[15px] transition-colors text-[rgba(255,255,255,.75)] hover:bg-white/5 hover:text-white"
      >
        {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-[rgba(255,255,255,.45)]" />}
        <span className="truncate">{item.title}</span>
      </a>
    );
  }

  return (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-3 text-[15px] transition-all relative",
        isActive
          ? "bg-[rgba(59,130,246,.12)] text-white font-medium border-l-[3px] border-l-[#3B82F6] rounded-r-lg ml-0 pl-[calc(0.75rem-3px)]"
          : "text-[rgba(255,255,255,.75)] hover:bg-white/5 hover:text-white rounded-lg border-l-[3px] border-transparent",
        compact && "py-2.5"
      )}
    >
      {Icon && <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[hsl(217,91%,60%)]" : "text-[hsl(0,0%,55%)]")} />}
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
  const navigate = useNavigate();
  const isSingleItem = (group.items?.length === 1 && !group.subGroups?.length);
  const singleHref = isSingleItem ? group.items![0].href : null;
  const singleIcon = isSingleItem ? group.items![0].icon : null;
  const isSingleActive = singleHref
    ? currentPath === singleHref || (singleHref !== "/" && currentPath.startsWith(singleHref))
    : false;

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
      {isSingleItem ? (
        <Link
          to={singleHref!}
          className={cn(
            "w-full flex items-center px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
            isSingleActive
              ? "text-white"
              : "text-[rgba(255,255,255,.75)] hover:text-white"
          )}
        >
          <span className="truncate">{group.label}</span>
        </Link>
      ) : (
      <button
        onClick={onToggle}
        className={cn(
          "group w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
          group.adminOnly 
            ? "text-primary hover:text-primary/80" 
            : "text-[rgba(255,255,255,.75)] hover:text-white"
        )}
      >
        <span className="flex items-center gap-2">
          {group.adminOnly && <Shield className="h-3.5 w-3.5" />}
          {group.label}
        </span>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" />
        )}
      </button>
      )}
      
      {!isSingleItem && isOpen && (
        <nav className="mt-1 space-y-1">
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
                    className="group w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,.35)] hover:text-[rgba(255,255,255,.6)]"
                  >
                    <span>{subGroup.label}</span>
                    {isSubGroupOpen ? (
                      <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" />
                    ) : (
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" />
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#0E1014] border-r border-[rgba(255,255,255,.05)] overflow-hidden flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-3 overflow-hidden shrink-0">
        <img src="/PROVEN%20AI%20MAIN6.png" alt="Proven AI" className="w-full max-w-[220px] h-auto object-contain -mt-3 -mb-12" />
      </div>

      {/* Navigation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pt-0 pb-2">
        {publicNavigation.map((group) => {
          const isActive = isGroupActiveForPath(group, currentPath);
          return (
            <React.Fragment key={group.label}>
              {group.sectionHeader && <SidebarSectionLabel label={group.sectionHeader} />}
              <NavGroupComponent
                group={group}
                currentPath={currentPath}
                isOpen={isGroupOpen(group.label, isActive)}
                onToggle={() => toggleGroup(group.label, isActive)}
              />
            </React.Fragment>
          );
        })}
        
        {/* Admin Console - only visible to admins */}
        {isAdmin && (() => {
          const isActive = isGroupActiveForPath(adminNavigation, currentPath);
          return (
            <>
              <div className="mt-4 mb-1 border-t border-[rgba(255,255,255,.06)]" />
              <NavGroupComponent
                group={adminNavigation}
                currentPath={currentPath}
                isOpen={isGroupOpen(adminNavigation.label, isActive)}
                onToggle={() => toggleGroup(adminNavigation.label, isActive)}
              />
            </>
          );
        })()}
      </div>

      {/* Footer - Auth Section */}
      <div className="px-4 py-4 border-t border-[rgba(255,255,255,.06)]">
        {isLoading ? (
          <div className="h-10 bg-[hsl(0,0%,20%)] rounded-lg animate-pulse" />
        ) : isAuthenticated ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                <p className="text-xs text-[rgba(255,255,255,.45)] truncate">{user?.email}</p>
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-[rgba(255,255,255,.75)] hover:bg-white/5 hover:text-white transition-colors"
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
