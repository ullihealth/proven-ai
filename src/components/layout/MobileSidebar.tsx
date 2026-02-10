import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Menu, ChevronDown, ChevronRight, LogIn, LogOut, Shield } from "lucide-react";
import {
  Compass,
  HelpCircle,
  BookOpen,
  BookText,
  Wrench,
  GraduationCap,
  LifeBuoy,
  Users,
  Play,
  FileText,
  MessageSquare,
  FolderOpen,
  Target,
  Lightbulb,
  TrendingUp,
  Eye,
  Grid3X3,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";

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
      ],
    },
    {
      label: "Content",
      items: [
        { title: "Daily Flow Posts", href: "/admin/content/daily-flow", icon: FileText },
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
  onItemClick: () => void;
}

const NavItemComponent = ({ item, currentPath, onItemClick }: NavItemComponentProps) => {
  const isActive = currentPath === item.href || 
    (item.href !== "/" && item.href !== "/admin" && currentPath.startsWith(item.href));
  const Icon = item.icon;

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onItemClick}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors text-[hsl(215,20%,82%)] hover:bg-white/5 hover:text-white min-h-[48px] touch-manipulation"
      >
        {Icon && <Icon className="h-5 w-5 flex-shrink-0 text-[hsl(215,16%,65%)]" />}
        <span>{item.title}</span>
      </a>
    );
  }

  return (
    <Link
      to={item.href}
      onClick={onItemClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-base transition-all relative min-h-[48px] touch-manipulation",
        isActive
          ? "bg-[hsl(217,91%,60%,0.15)] text-white font-medium border-l-4 border-l-[hsl(217,91%,60%)] rounded-r-lg ml-0 pl-[calc(1rem-4px)]"
          : "text-[hsl(215,20%,82%)] hover:bg-white/5 hover:text-white rounded-lg border-l-4 border-transparent"
      )}
    >
      {Icon && <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-[hsl(217,91%,60%)]" : "text-[hsl(215,16%,65%)]")} />}
      <span>{item.title}</span>
    </Link>
  );
};

interface NavGroupComponentProps {
  group: NavGroup;
  currentPath: string;
  onItemClick: () => void;
}

const NavGroupComponent = ({ group, currentPath, onItemClick }: NavGroupComponentProps) => {
  const getSubGroupKey = (subGroup: NavSubGroup, idx: number) =>
    subGroup.label ? subGroup.label : `__ungrouped_${idx}`;

  const isSubGroupActive = (subGroup: NavSubGroup) =>
    subGroup.items.some(item =>
      currentPath === item.href || (item.href !== "/" && item.href !== "/admin" && currentPath.startsWith(item.href))
    );

  const isGroupActive = group.items?.some(item => 
    currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href))
  ) || group.subGroups?.some(sg => 
    sg.items.some(item => currentPath === item.href || (item.href !== "/" && item.href !== "/admin" && currentPath.startsWith(item.href)))
  );
  const [isOpen, setIsOpen] = useState(group.defaultOpen || isGroupActive);
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
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation",
          group.adminOnly 
            ? "text-primary hover:text-primary/80" 
            : "text-[hsl(220,13%,91%)] hover:text-white"
        )}
      >
        <span className="flex items-center gap-2">
          {group.adminOnly && <Shield className="h-4 w-4" />}
          {group.label}
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      
      {isOpen && (
        <nav className="space-y-1 px-2">
          {group.items?.map((item) => (
            <NavItemComponent key={item.href} item={item} currentPath={currentPath} onItemClick={onItemClick} />
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
                    className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[hsl(215,16%,50%)] hover:text-[hsl(215,20%,75%)]"
                  >
                    <span>{subGroup.label}</span>
                    {isSubGroupOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
                {isSubGroupOpen && (
                  <div className="space-y-1 px-2">
                    {subGroup.items.map((item) => (
                      <NavItemComponent key={item.href} item={item} currentPath={currentPath} onItemClick={onItemClick} />
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

export const MobileSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, signOut, isLoading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <>
      {/* Fixed mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[hsl(222,47%,11%)] border-b border-[hsl(222,40%,18%)] flex items-center justify-between px-4">
        <div className="flex items-center">
          <img src="/proven-ai-logo-5.png" alt="Proven AI" className="h-9 w-auto" />
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors touch-manipulation">
              <Menu className="h-6 w-6 text-white" />
            </button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="w-[300px] p-0 bg-[hsl(222,47%,11%)] border-l border-[hsl(222,40%,18%)]"
          >
            <div className="flex flex-col h-full">
              {/* Sheet header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-[hsl(222,40%,18%)]">
                <span className="text-base font-medium text-white">Menu</span>
              </div>
              
              {/* Navigation */}
              <div className="flex-1 overflow-y-auto py-4">
                {publicNavigation.map((group) => (
                  <NavGroupComponent
                    key={group.label}
                    group={group}
                    currentPath={currentPath}
                    onItemClick={() => setOpen(false)}
                  />
                ))}
                
                {/* Admin Console - only visible to admins */}
                {isAdmin && (
                  <NavGroupComponent
                    group={adminNavigation}
                    currentPath={currentPath}
                    onItemClick={() => setOpen(false)}
                  />
                )}
              </div>
              
              {/* Footer - Auth Section */}
              <div className="px-4 py-4 border-t border-[hsl(222,40%,18%)]">
                {isLoading ? (
                  <div className="h-12 bg-[hsl(222,35%,20%)] rounded-lg animate-pulse" />
                ) : isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-white truncate">{user?.name || "User"}</p>
                        <p className="text-sm text-[hsl(215,16%,65%)] truncate">{user?.email}</p>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 px-1">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium text-primary">Administrator</span>
                      </div>
                    )}
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base text-[hsl(215,20%,82%)] hover:bg-white/5 hover:text-white transition-colors min-h-[48px] touch-manipulation"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium min-h-[48px] touch-manipulation"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
};
