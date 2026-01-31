import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Menu, X, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import {
  Compass,
  HelpCircle,
  BookOpen,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
    label: "Tools",
    defaultOpen: true,
    items: [
      { title: "Core Tools", href: "/tools", icon: FolderOpen },
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
  onItemClick: () => void;
}

const NavGroupComponent = ({ group, currentPath, onItemClick }: NavGroupComponentProps) => {
  const isGroupActive = group.items.some(item => currentPath.startsWith(item.href));
  const [isOpen, setIsOpen] = useState(group.defaultOpen || isGroupActive);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[hsl(220,13%,91%)] hover:text-white transition-colors min-h-[44px] touch-manipulation"
      >
        <span>{group.label}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      
      {isOpen && (
        <nav className="space-y-1 px-2">
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
                key={item.title}
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

  return (
    <>
      {/* Fixed mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[hsl(222,47%,11%)] border-b border-[hsl(222,40%,18%)] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">Proven AI</span>
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
                {navigation.map((group) => (
                  <NavGroupComponent
                    key={group.label}
                    group={group}
                    currentPath={currentPath}
                    onItemClick={() => setOpen(false)}
                  />
                ))}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-4 border-t border-[hsl(222,40%,18%)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[hsl(222,35%,20%)] flex items-center justify-center">
                    <span className="text-sm font-medium text-[hsl(215,20%,82%)]">JD</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-white truncate">John Doe</p>
                    <p className="text-sm text-[hsl(215,16%,65%)] truncate">Free Member</p>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
};
