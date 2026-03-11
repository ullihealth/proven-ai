import { useState, useRef, useCallback, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBoards, updateBoard, reorderBoards } from "@/lib/manager/managerApi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import QuickAddFAB from "./QuickAddFAB";
import MobileTabBar from "./MobileTabBar";
import PomodoroTimer from "./PomodoroTimer";
import { TimerProvider } from "@/lib/manager/TimerContext";
import { CardTimerProvider, useCardTimer } from "@/lib/manager/CardTimerContext";
import { ThemeProvider } from "@/lib/theme";
import {
  LayoutDashboard, Sparkles, Settings, LogOut, Calendar, ChevronLeft, ChevronRight, Crosshair, ScrollText, FolderOpen, GanttChart as GanttChartIcon, Pause, Play, Square as StopIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEffect } from "react";

const stripEmoji = (s: string) => s.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();

const BOARD_COLORS = ["#00bcd4","#e91e8c","#4caf50","#ff9800","#f44336","#9c27b0","#2196f3","#009688","#ff5722","#607d8b"];

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

// Persistent sidebar card timer indicator
function CardTimerIndicator({ collapsed }: { collapsed: boolean }) {
  const { activeCardTimer, pauseTimer, resumeTimer, stopTimer } = useCardTimer();
  const [open, setOpen] = useState(false);

  if (!activeCardTimer) return null;

  const { cardTitle, elapsedSeconds, isPaused } = activeCardTimer;
  const h = Math.floor(elapsedSeconds / 3600);
  const m = Math.floor((elapsedSeconds % 3600) / 60);
  const s = elapsedSeconds % 60;
  const timeStr = h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-2 pl-6 pr-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-card)]",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? `${cardTitle} ${timeStr}` : undefined}
        >
          <span className={isPaused ? "text-[#d29922]" : "text-[#4caf50]"}>
            {isPaused ? "\u2016" : "\u25cf"}
          </span>
          {!collapsed && (
            <>
              <span className="truncate max-w-[100px] text-[var(--text-muted)]">
                {cardTitle}
              </span>
              <span className={cn("tabular-nums ml-auto shrink-0 font-mono", isPaused ? "text-[#d29922]" : "text-[#4caf50]")}>
                {timeStr}
              </span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-52 p-3 bg-[var(--bg-elevated)] border-[var(--border)] space-y-2">
        <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{cardTitle}</div>
        <div className={cn("text-xl font-mono tabular-nums font-bold", isPaused ? "text-[#d29922]" : "text-[#00bcd4]")}>
          {timeStr}
        </div>
        <div className="flex gap-2">
          {isPaused ? (
            <button onClick={() => { resumeTimer(); setOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#d29922]/20 text-[#d29922] hover:bg-[#d29922]/30 transition-colors">
              <Play className="h-3 w-3" /> Resume
            </button>
          ) : (
            <button onClick={() => { pauseTimer(); setOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#00bcd4]/20 text-[#00bcd4] hover:bg-[#00bcd4]/30 transition-colors">
              <Pause className="h-3 w-3" /> Pause
            </button>
          )}
          <button onClick={() => { stopTimer(); setOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#f85149]/20 text-[#f85149] hover:bg-[#f85149]/30 transition-colors">
            <StopIcon className="h-3 w-3" /> Stop
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
  const queryClient = useQueryClient();
  const [boardColors, setBoardColors] = useState<Record<string, string>>({});
  const handleBoardColorChange = async (boardId: string, color: string) => {
    setBoardColors(prev => ({ ...prev, [boardId]: color }));
    await updateBoard(boardId, { color });
    queryClient.invalidateQueries({ queryKey: ["boards"] });
  };

  // Drag-to-reorder state
  const [orderedBoards, setOrderedBoards] = useState<typeof boards>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragActive = useRef(false);

  useEffect(() => { setOrderedBoards(boards); }, [boards]);

  const handleBoardMouseDown = useCallback((e: React.MouseEvent, idx: number) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragActive.current = false;

    const onMouseMove = (mv: MouseEvent) => {
      if (!dragStartPos.current) return;
      const dx = mv.clientX - dragStartPos.current.x;
      const dy = mv.clientY - dragStartPos.current.y;
      if (!dragActive.current && Math.sqrt(dx * dx + dy * dy) > 5) {
        dragActive.current = true;
        setDragIdx(idx);
      }
    };

    const onMouseUp = async () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (!dragActive.current) { setDragIdx(null); setDropIdx(null); return; }
      setDragIdx(prev => {
        setDropIdx(di => {
          if (di !== null && prev !== null && di !== prev) {
            setOrderedBoards(ob => {
              const next = [...ob];
              const [moved] = next.splice(prev, 1);
              next.splice(di > prev ? di - 1 : di, 0, moved);
              reorderBoards(next.map(b => b.id)).then(() =>
                queryClient.invalidateQueries({ queryKey: ["boards"] })
              );
              return next;
            });
          }
          return null;
        });
        return null;
      });
      dragActive.current = false;
      dragStartPos.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [queryClient]);

  const handleBoardMouseEnter = useCallback((idx: number) => {
    if (dragActive.current) setDropIdx(idx);
  }, []);

  const collapsed = isTablet ? sidebarCollapsed : false;
  const sidebarWidth = collapsed ? "w-12" : "w-64";

  const handleSignOut = async () => { await signOut(); navigate("/auth"); };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 pl-6 pr-4 py-2 text-sm font-medium transition-colors",
      collapsed && "justify-center px-2",
      isActive
        ? "text-[#00bcd4]"
        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
          <TooltipContent side="right" className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  };

  if (isMobile) {
    return (
      <ThemeProvider>
        <TimerProvider>
          <CardTimerProvider>
            <div className="flex flex-col min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
              <main className="flex-1 min-h-0 pb-16"><Outlet /></main>
              <MobileTabBar />
              <PomodoroTimer />
              <QuickAddFAB mobile />
            </div>
          </CardTimerProvider>
        </TimerProvider>
      </ThemeProvider>
    );
  }

  const sidebar = (
    <aside className={cn("h-screen flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border)] fixed lg:sticky top-0 z-40 transition-[width] duration-300 ease-in-out", sidebarWidth)}>
      <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
        {!collapsed && <span className="text-lg font-bold text-[#00bcd4] tracking-tight">ProvenAI Manager</span>}
        {isTablet && (
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItem("/manage", null, "Dashboard", true)}
        {navItem("/manage/performance", null, "Performance")}
        {navItem("/manage/calendar", null, "Calendar")}
        {!collapsed && <div className="mt-4 pb-1 px-2"><span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Boards</span></div>}
        {collapsed && <div className="pt-2" />}
        {orderedBoards.map((b, idx) => {
          const isDragging = dragIdx === idx;
          const insertBefore = dropIdx === idx && dragIdx !== null && dragIdx !== idx;
          const insertAfter = dropIdx === idx && dragIdx !== null && dragIdx > idx && idx === orderedBoards.length - 1;
          void insertAfter;

          if (isTimelinePage) {
            const dotColor = boardColors[b.id] || b.color || "#00bcd4";
            return (
              <div key={b.id}>
                {insertBefore && <div className="mx-4 h-0.5 bg-[#00bcd4] rounded-full" />}
                <div
                  className={cn("flex items-center px-4 py-2 cursor-grab select-none", collapsed && "justify-center px-2", isDragging && "opacity-40")}
                  onMouseDown={(e) => handleBoardMouseDown(e, idx)}
                  onMouseEnter={() => handleBoardMouseEnter(idx)}
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="w-3 h-3 rounded-full flex-shrink-0 cursor-pointer ring-offset-1 hover:ring-2 hover:ring-[#a0aab8] transition-all"
                        style={{ backgroundColor: dotColor }}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 bg-[var(--bg-elevated)] border-[var(--border)]" side="right" align="start">
                      <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                        {BOARD_COLORS.map(c => (
                          <button key={c} onClick={() => handleBoardColorChange(b.id, c)}
                            className={cn("w-6 h-6 rounded-full transition-all", dotColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#242b35]" : "hover:scale-110")}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {!collapsed && (
                    <NavLink
                      to={`/manage/board/${b.id}`}
                      className={({ isActive }) => cn(
                        "ml-3 text-sm font-medium transition-colors truncate",
                        isActive ? "text-[#00bcd4]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      )}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {stripEmoji(b.name)}
                    </NavLink>
                  )}
                </div>
              </div>
            );
          }

          const content = (
            <div key={b.id}>
              {insertBefore && <div className="mx-4 h-0.5 bg-[#00bcd4] rounded-full" />}
              <div
                className={cn(
                  "flex items-center gap-3 pl-6 pr-4 py-2 text-sm font-medium transition-colors cursor-grab select-none",
                  collapsed && "justify-center px-2",
                  isDragging && "opacity-40"
                )}
                onMouseDown={(e) => handleBoardMouseDown(e, idx)}
                onMouseEnter={() => handleBoardMouseEnter(idx)}
              >
                <NavLink
                  to={`/manage/board/${b.id}`}
                  className={({ isActive }) => cn(
                    "flex-1 truncate transition-colors",
                    isActive ? "text-[#00bcd4]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                  onMouseDown={(e) => { if (dragActive.current) e.preventDefault(); }}
                >
                  {!collapsed && stripEmoji(b.name)}
                </NavLink>
              </div>
            </div>
          );

          if (collapsed) {
            return (
              <Tooltip key={b.id}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right" className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]">{stripEmoji(b.name)}</TooltipContent>
              </Tooltip>
            );
          }
          return content;
        })}
        {!collapsed && <div className="mt-4 pb-1 px-2"><span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Intelligence</span></div>}
        {collapsed && <div className="pt-2" />}
        {navItem("/manage/strategy", null, "Strategy")}
        {navItem("/manage/storage", null, "Storage")}
        {navItem("/manage/notes", null, "Notes")}
        {/* Card timer indicator */}
        <div className="pt-2 mt-2">
          <CardTimerIndicator collapsed={collapsed} />
        </div>
      </nav>

      <div className="border-t border-[var(--border)] p-3 space-y-1">
        {navItem("/manage/ai", null, "AI Assistant", false, "text-[#e91e8c] hover:text-[#e91e8c]")}
        {navItem("/manage/settings", null, "Settings")}
        {!collapsed && (
          <div className="flex items-center justify-between px-4 py-2 text-sm text-[var(--text-muted)]">
            <span className="truncate">{user?.email ?? "User"}</span>
            <button onClick={handleSignOut} className="hover:text-[#f85149] transition-colors" title="Sign out"><LogOut className="h-4 w-4" /></button>
          </div>
        )}
        {collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleSignOut} className="flex items-center justify-center w-full py-2 text-[var(--text-muted)] hover:text-[#f85149] transition-colors"><LogOut className="h-4 w-4" /></button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]">Sign out</TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );

  return (
    <ThemeProvider>
      <TimerProvider>
        <CardTimerProvider>
          <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <div className="hidden lg:block">{sidebar}</div>
            <div className="hidden md:block lg:hidden">{sidebar}</div>
            <main className="flex-1 min-h-screen min-w-0"><Outlet /></main>
            <PomodoroTimer />
            <QuickAddFAB />
          </div>
        </CardTimerProvider>
      </TimerProvider>
    </ThemeProvider>
  );
}
