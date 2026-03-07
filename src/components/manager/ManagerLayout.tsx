import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { fetchBoards } from "@/lib/manager/managerApi";
import QuickAddFAB from "./QuickAddFAB";
import MobileTabBar from "./MobileTabBar";
import PomodoroTimer from "./PomodoroTimer";
import { TimerProvider } from "@/lib/manager/TimerContext";
import {
  LayoutDashboard, Sparkles, Settings, LogOut, Calendar, ChevronLeft, ChevronRight, Crosshair, ScrollText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEffect } from "react";

const useIsTablet = () => {
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px) and (max-width: 1024px)");
    setIsTablet(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isTablet;
};

export default function ManagerLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const { data: boardsData } = useQuery({ queryKey: ["boards"], queryFn: fetchBoards });
  const boards = boardsData?.boards ?? [];

  const collapsed = isTablet ? sidebarCollapsed : false;
  const sidebarWidth = collapsed ? "w-12" : "w-64";

  const handleSignOut = async () => { await signOut(); navigate("/auth"); };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
      collapsed && "justify-center px-2",
      isActive
        ? "bg-[#1c2128] text-[#00bcd4] border-l-[3px] border-[#00bcd4]"
        : "text-[#a0aab8] hover:text-[#e0e7ef] hover:bg-[#242b35]"
    );

  const navItem = (to: string, icon: React.ReactNode, label: string, end?: boolean, extraClass?: string) => {
    const link = (
      <NavLink to={to} end={end}
        className={({ isActive }) => cn(linkClass({ isActive }), extraClass)}
      >
        {icon}
        {!collapsed && label}
      </NavLink>
    );
    if (collapsed) {
      return (
        <Tooltip key={to}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="bg-[#242b35] text-[#e0e7ef] border-[#30363d]">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  };

  if (isMobile) {
    return (
      <TimerProvider>
        <div className="flex flex-col min-h-screen bg-[#13181f] text-[#e0e7ef]">
          <main className="flex-1 min-h-0 pb-16"><Outlet /></main>
          <MobileTabBar />
          <PomodoroTimer />
          <QuickAddFAB mobile />
        </div>
      </TimerProvider>
    );
  }

  const sidebar = (
    <aside className={cn("h-screen flex flex-col bg-[#161b22] border-r border-[#30363d] fixed lg:sticky top-0 z-40 transition-[width] duration-300 ease-in-out", sidebarWidth)}>
      <div className="p-5 border-b border-[#30363d] flex items-center justify-between">
        {!collapsed && <span className="text-lg font-bold text-[#00bcd4] font-mono tracking-tight">ProvenAI Manager</span>}
        {isTablet && (
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-[#a0aab8] hover:text-[#e0e7ef] transition-colors">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItem("/manage", <LayoutDashboard className="h-4 w-4" />, "Dashboard", true)}
        {navItem("/manage/focus", <Crosshair className="h-4 w-4" />, "Focus")}
        {!collapsed && <div className="pt-4 pb-1 px-4"><span className="text-xs font-semibold text-[#a0aab8] uppercase tracking-wider">Boards</span></div>}
        {collapsed && <div className="pt-2" />}
        {boards.map((b) => navItem(`/manage/board/${b.id}`, <span className="text-base leading-none">{b.icon}</span>, b.name))}
        {navItem("/manage/calendar", <Calendar className="h-4 w-4" />, "Calendar")}
        {!collapsed && <div className="pt-4 pb-1 px-4"><span className="text-xs font-semibold text-[#a0aab8] uppercase tracking-wider">Intelligence</span></div>}
        {collapsed && <div className="pt-2" />}
        {navItem("/manage/strategy", <ScrollText className="h-4 w-4" />, "Strategy")}
      </nav>

      <div className="border-t border-[#30363d] p-3 space-y-1">
        {navItem("/manage/ai", <Sparkles className="h-4 w-4" />, "AI Assistant", false, "text-[#e91e8c] hover:text-[#e91e8c]")}
        {navItem("/manage/settings", <Settings className="h-4 w-4" />, "Settings")}
        {!collapsed && (
          <div className="flex items-center justify-between px-4 py-2 text-sm text-[#a0aab8]">
            <span className="truncate">{user?.email ?? "User"}</span>
            <button onClick={handleSignOut} className="hover:text-[#f85149] transition-colors" title="Sign out"><LogOut className="h-4 w-4" /></button>
          </div>
        )}
        {collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleSignOut} className="flex items-center justify-center w-full py-2 text-[#a0aab8] hover:text-[#f85149] transition-colors"><LogOut className="h-4 w-4" /></button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#242b35] text-[#e0e7ef] border-[#30363d]">Sign out</TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );

  return (
    <TimerProvider>
      <div className="flex min-h-screen bg-[#13181f] text-[#e0e7ef]">
        <div className="hidden lg:block">{sidebar}</div>
        <div className="hidden md:block lg:hidden">{sidebar}</div>
        <main className="flex-1 min-h-screen min-w-0"><Outlet /></main>
        <PomodoroTimer />
        <QuickAddFAB />
      </div>
    </TimerProvider>
  );
}
