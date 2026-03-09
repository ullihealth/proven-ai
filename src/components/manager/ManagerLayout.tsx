import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { fetchBoards } from "@/lib/manager/managerApi";
import QuickAddFAB from "./QuickAddFAB";
import MobileTabBar from "./MobileTabBar";
import PomodoroTimer from "./PomodoroTimer";
import { TimerProvider } from "@/lib/manager/TimerContext";
import {
  LayoutDashboard, Sparkles, Settings, LogOut, Calendar, ChevronLeft, ChevronRight, Crosshair, ScrollText, FolderOpen, GanttChart as GanttChartIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEffect } from "react";

const stripEmoji = (s: string) => s.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();

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

  const location = useLocation();
  const isTimelinePage = location.pathname === "/manage/timeline";

  const { data: boardsData } = useQuery({ queryKey: ["boards"], queryFn: fetchBoards });
  const boards = boardsData?.boards ?? [];

  const collapsed = isTablet ? sidebarCollapsed : false;
  const sidebarWidth = collapsed ? "w-12" : "w-64";

  const handleSignOut = async () => { await signOut(); navigate("/auth"); };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 pl-6 pr-4 py-2 text-sm font-medium transition-colors",
      collapsed && "justify-center px-2",
      isActive
        ? "text-[#00bcd4]"
        : "text-[#a0aab8] hover:text-[#e0e7ef]"
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

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItem("/manage", null, "Dashboard", true)}
        {navItem("/manage/focus", null, "Focus")}
        {navItem("/manage/calendar", null, "Calendar")}
        {!collapsed && <div className="mt-4 pb-1 px-2"><span className="text-[11px] font-medium text-[#a0aab8] uppercase tracking-widest">Boards</span></div>}
        {collapsed && <div className="pt-2" />}
        {boards.map((b) => navItem(
          `/manage/board/${b.id}`,
          isTimelinePage
            ? <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: b.color || "#00bcd4" }} />
            : null,
          stripEmoji(b.name)
        ))}
        {!collapsed && <div className="mt-4 pb-1 px-2"><span className="text-[11px] font-medium text-[#a0aab8] uppercase tracking-widest">Intelligence</span></div>}
        {collapsed && <div className="pt-2" />}
        {navItem("/manage/strategy", null, "Strategy")}
        {navItem("/manage/storage", null, "Storage")}
      </nav>

      <div className="border-t border-[#30363d] p-3 space-y-1">
        {navItem("/manage/ai", null, "AI Assistant", false, "text-[#e91e8c] hover:text-[#e91e8c]")}
        {navItem("/manage/settings", null, "Settings")}
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
