import { useState, useRef, useCallback, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBoards, updateBoard, reorderBoards, fetchBoard, updateCard } from "@/lib/manager/managerApi";
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
import { toast } from "@/hooks/use-toast";

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
  const boardItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragState = useRef<{ pointerId: number; startY: number; isDragging: boolean; idx: number } | null>(null);

  // Cross-board card drag-over state
  const [cardDragOverBoardId, setCardDragOverBoardId] = useState<string | null>(null);
  const cardDragOverBoardIdRef = useRef<string | null>(null);

  useEffect(() => { setOrderedBoards(boards); }, [boards]);

  // Listen for card-drag-over-sidebar / card-drag-left-sidebar / card-drop-on-board events
  useEffect(() => {
    const handleDragOver = (e: Event) => {
      const { y } = (e as CustomEvent<{ y: number; cardId: string }>).detail;
      let targetBoardId: string | null = null;
      let targetBoardName: string | null = null;
      for (let i = 0; i < boardItemRefs.current.length; i++) {
        const el = boardItemRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) {
          targetBoardId = orderedBoards[i]?.id ?? null;
          targetBoardName = orderedBoards[i]?.name ? stripEmoji(orderedBoards[i].name) : null;
          break;
        }
      }
      cardDragOverBoardIdRef.current = targetBoardId;
      setCardDragOverBoardId(targetBoardId);
      window.dispatchEvent(new CustomEvent('card-drag-board-target', {
        detail: { boardId: targetBoardId, boardName: targetBoardName ?? '' },
      }));
    };

    const handleDragLeft = () => {
      cardDragOverBoardIdRef.current = null;
      setCardDragOverBoardId(null);
    };

    const handleDrop = async (e: Event) => {
      const { cardId } = (e as CustomEvent<{ cardId: string }>).detail;
      const targetBoardId = cardDragOverBoardIdRef.current;
      cardDragOverBoardIdRef.current = null;
      setCardDragOverBoardId(null);
      if (!targetBoardId) return;
      try {
        const boardData = await fetchBoard(targetBoardId);
        const cols = [...boardData.columns].sort((a, b) => a.sort_order - b.sort_order);
        const firstCol = cols[0];
        if (!firstCol) return;
        await updateCard(cardId, { board_id: targetBoardId, column_id: firstCol.id });
        const boardName = orderedBoards.find((b) => b.id === targetBoardId)?.name ?? targetBoardId;
        toast({ title: `Card moved to ${stripEmoji(boardName)}` });
        navigate(`/manage/board/${targetBoardId}`);
      } catch {
        toast({ title: 'Failed to move card', variant: 'destructive' });
      }
    };

    window.addEventListener('card-drag-over-sidebar', handleDragOver);
    window.addEventListener('card-drag-left-sidebar', handleDragLeft);
    window.addEventListener('card-drop-on-board', handleDrop);
    return () => {
      window.removeEventListener('card-drag-over-sidebar', handleDragOver);
      window.removeEventListener('card-drag-left-sidebar', handleDragLeft);
      window.removeEventListener('card-drop-on-board', handleDrop);
    };
  }, [orderedBoards, navigate]);

  const getDropIdxFromY = useCallback((clientY: number) => {
    let best = 0;
    for (let i = 0; i < boardItemRefs.current.length; i++) {
      const el = boardItemRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY > rect.top + rect.height / 2) best = i + 1;
    }
    return best;
  }, []);

  const handleBoardPointerDown = useCallback((e: React.PointerEvent, idx: number) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { pointerId: e.pointerId, startY: e.clientY, isDragging: false, idx };
  }, []);

  const handleBoardPointerMove = useCallback((e: React.PointerEvent) => {
    const s = dragState.current;
    if (!s || s.pointerId !== e.pointerId) return;
    if (!s.isDragging && Math.abs(e.clientY - s.startY) > 8) {
      s.isDragging = true;
      setDragIdx(s.idx);
    }
    if (s.isDragging) {
      setDropIdx(getDropIdxFromY(e.clientY));
    }
  }, [getDropIdxFromY]);

  const handleBoardPointerUp = useCallback((e: React.PointerEvent, idx: number, boardId: string) => {
    const s = dragState.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const wasDragging = s.isDragging;
    dragState.current = null;
    setDragIdx(null);

    if (!wasDragging) {
      setDropIdx(null);
      navigate(`/manage/board/${boardId}`);
      return;
    }

    const di = getDropIdxFromY(e.clientY);
    setDropIdx(null);
    if (di !== idx && di !== idx + 1) {
      setOrderedBoards(ob => {
        const next = [...ob];
        const [moved] = next.splice(idx, 1);
        const insertAt = di > idx ? di - 1 : di;
        next.splice(insertAt, 0, moved);
        reorderBoards(next.map(b => b.id)).then(() =>
          queryClient.invalidateQueries({ queryKey: ["boards"] })
        );
        return next;
      });
    }
  }, [navigate, queryClient, getDropIdxFromY]);

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
        <div className="relative">
          {orderedBoards.map((b, idx) => {
            const isDragging = dragIdx === idx;
            const isActive = location.pathname === `/manage/board/${b.id}`;

            const insertLine = (pos: number) => dropIdx === pos && dragIdx !== null && (
              <div className="absolute left-4 right-4 h-0.5 rounded-full pointer-events-none z-10" style={{ backgroundColor: "#00bcd4", top: pos === 0 ? 0 : undefined }} />
            );

            const rowEl = (
              <div
                key={b.id}
                ref={el => { boardItemRefs.current[idx] = el; }}
                draggable={false}
                className={cn(
                  "relative select-none cursor-grab transition-colors",
                  isDragging && "opacity-40",
                  cardDragOverBoardId === b.id && "bg-[#00bcd4]/10 border-l-2 border-[#00bcd4]",
                  cardDragOverBoardId !== null && cardDragOverBoardId !== b.id && "opacity-50"
                )}
                onPointerDown={(e) => handleBoardPointerDown(e, idx)}
                onPointerMove={handleBoardPointerMove}
                onPointerUp={(e) => handleBoardPointerUp(e, idx, b.id)}
                onPointerCancel={() => { dragState.current = null; setDragIdx(null); setDropIdx(null); }}
              >
                {dropIdx === idx && dragIdx !== null && dragIdx !== idx && (
                  <div className="absolute left-4 right-4 top-0 h-0.5 rounded-full bg-[#00bcd4] pointer-events-none z-10" />
                )}
                {isTimelinePage ? (
                  <div className={cn("flex items-center px-4 py-2", collapsed && "justify-center px-2")}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="w-3 h-3 rounded-full flex-shrink-0 cursor-pointer ring-offset-1 hover:ring-2 hover:ring-[#a0aab8] transition-all"
                          style={{ backgroundColor: boardColors[b.id] || b.color || "#00bcd4" }}
                          onPointerDown={(e) => e.stopPropagation()}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2 bg-[var(--bg-elevated)] border-[var(--border)]" side="right" align="start">
                        <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                          {BOARD_COLORS.map(c => (
                            <button key={c} onClick={() => handleBoardColorChange(b.id, c)}
                              className={cn("w-6 h-6 rounded-full transition-all", (boardColors[b.id] || b.color) === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#242b35]" : "hover:scale-110")}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {!collapsed && (
                      <span className={cn(
                        "ml-3 text-sm font-medium transition-colors truncate",
                        isActive ? "text-[#00bcd4]" : "text-[var(--text-muted)]"
                      )}>
                        {stripEmoji(b.name)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className={cn(
                    "flex items-center gap-3 pl-6 pr-4 py-2 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-2",
                    isActive ? "text-[#00bcd4]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}>
                    {!collapsed && stripEmoji(b.name)}
                  </div>
                )}
              </div>
            );
            void insertLine;

            if (collapsed) {
              return (
                <Tooltip key={b.id}>
                  <TooltipTrigger asChild>{rowEl}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]">{stripEmoji(b.name)}</TooltipContent>
                </Tooltip>
              );
            }
            return rowEl;
          })}
          {dropIdx === orderedBoards.length && dragIdx !== null && (
            <div className="absolute left-4 right-4 bottom-0 h-0.5 rounded-full bg-[#00bcd4] pointer-events-none z-10" />
          )}
        </div>
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
