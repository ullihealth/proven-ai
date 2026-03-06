import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import QuickAddFAB from "./QuickAddFAB";
import MobileTabBar from "./MobileTabBar";
import {
  LayoutDashboard, FileText, Rocket, Mail, Handshake, Brain,
  Sparkles, Settings, Menu, X, LogOut, Calendar, ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const boards = [
  { id: "content", label: "Content Pipeline", icon: FileText, path: "/manage/board/content" },
  { id: "platform", label: "ProvenAI Platform", icon: Rocket, path: "/manage/board/platform" },
  { id: "funnel", label: "Funnel & Email", icon: Mail, path: "/manage/board/funnel" },
  { id: "bizdev", label: "Business Dev", icon: Handshake, path: "/manage/board/bizdev" },
  { id: "strategy", label: "Strategy & Horizon", icon: Brain, path: "/manage/board/strategy" },
];

const useIsTablet = () => {
  const [isTablet, setIsTablet] = useState(false);
  if (typeof window !== "undefined") {
    const mql = window.matchMedia("(min-width: 768px) and (max-width: 1024px)");
    if (isTablet !== mql.matches) setIsTablet(mql.matches);
    mql.addEventListener("change", (e) => setIsTablet(e.matches));
  }
  return isTablet;
};

export default function ManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // On tablet, default collapsed
  const collapsed = isTablet ? sidebarCollapsed : false;
  const sidebarWidth = collapsed ? "w-12" : "w-64";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors",
      collapsed && "justify-center px-2",
      isActive
        ? "bg-[#1c2128] text-[#00bcd4] border-l-2 border-[#00bcd4]"
        : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
    );

  const navItem = (to: string, icon: React.ReactNode, label: string, end?: boolean, extraClass?: string) => {
    const link = (
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) => cn(linkClass({ isActive }), extraClass)}
        onClick={() => setSidebarOpen(false)}
      >
        {icon}
        {!collapsed && label}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip key={to}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="bg-[#1c2128] text-[#c9d1d9] border-[#30363d]">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return link;
  };

  // Mobile: no sidebar, bottom tab bar
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0d1117] text-[#c9d1d9]">
        <main className="flex-1 min-h-0 pb-16">
          <Outlet />
        </main>
        <MobileTabBar />
        <QuickAddFAB mobile />
      </div>
    );
  }

  const sidebar = (
    <aside
      className={cn(
        "h-screen flex flex-col bg-[#0d1117] border-r border-[#30363d] fixed lg:sticky top-0 z-40 transition-[width] duration-300 ease-in-out",
        sidebarWidth
      )}
    >
      {/* Logo */}
      <div className="p-5 border-b border-[#30363d] flex items-center justify-between">
        {!collapsed && (
          <span className="text-lg font-bold text-[#00bcd4] font-mono tracking-tight">
            ProvenAI Manager
          </span>
        )}
        {isTablet && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItem("/manage", <LayoutDashboard className="h-4 w-4" />, "Dashboard", true)}

        {!collapsed && (
          <div className="pt-4 pb-1 px-4">
            <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Boards</span>
          </div>
        )}
        {collapsed && <div className="pt-2" />}

        {boards.map((b) =>
          navItem(b.path, <b.icon className="h-4 w-4" />, b.label)
        )}

        {navItem("/manage/calendar", <Calendar className="h-4 w-4" />, "Calendar")}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#30363d] p-3 space-y-1">
        {navItem("/manage/ai", <Sparkles className="h-4 w-4" />, "AI Assistant", false, "text-[#e91e8c] hover:text-[#e91e8c]")}
        {navItem("/manage/settings", <Settings className="h-4 w-4" />, "Settings")}

        {!collapsed && (
          <div className="flex items-center justify-between px-4 py-2 text-sm text-[#8b949e]">
            <span className="truncate">{user?.email ?? "User"}</span>
            <button onClick={handleSignOut} className="hover:text-[#f85149] transition-colors" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        {collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleSignOut} className="flex items-center justify-center w-full py-2 text-[#8b949e] hover:text-[#f85149] transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1c2128] text-[#c9d1d9] border-[#30363d]">
              Sign out
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Desktop/Tablet sidebar */}
      <div className="hidden lg:block">
        {sidebar}
      </div>

      {/* Tablet sidebar (768-1024) */}
      <div className="hidden md:block lg:hidden">
        {sidebar}
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-screen min-w-0">
        <Outlet />
      </main>

      <QuickAddFAB />
    </div>
  );
}
