import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import type { Card, Column, Board } from "@/lib/manager/types";
import { cn } from "@/lib/utils";
import {
  addDays, addWeeks, addMonths, addQuarters,
  differenceInDays,
  format, startOfDay, startOfWeek, startOfMonth, startOfQuarter,
  endOfDay, isToday
} from "date-fns";
import { fetchBoards, fetchBoard, updateBoard, fetchManagerSettings } from "@/lib/manager/managerApi";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useQueryClient } from "@tanstack/react-query";

type ZoomLevel = "day" | "week" | "month" | "year";

interface GanttChartProps {
  cards: Card[];
  columns?: Column[];
  boards?: Board[];
  onCardClick: (card: Card) => void;
  onCardUpdate: (id: string, updates: Partial<Card>) => Promise<void>;
  groupBy?: "column" | "board";
  boardColorMap?: Record<string, string>;
}

const ROW_HEIGHT = 32;
const COL_WIDTHS: Record<ZoomLevel, number> = { day: 40, week: 80, month: 120, year: 140 };
const ZOOM_LABELS: ZoomLevel[] = ["day", "week", "month", "year"];
const BOARD_COLORS = ["#00bcd4","#e91e8c","#4caf50","#ff9800","#f44336","#9c27b0","#2196f3","#009688","#ff5722","#607d8b"];

function getTimeRange(zoom: ZoomLevel) {
  const now = new Date();
  let start: Date, end: Date;
  switch (zoom) {
    case "day":
      start = startOfDay(addDays(now, -365));
      end = endOfDay(addDays(now, 365 * 3));
      break;
    case "week":
      start = startOfWeek(addWeeks(now, -52), { weekStartsOn: 1 });
      end = startOfWeek(addWeeks(now, 52 * 3), { weekStartsOn: 1 });
      break;
    case "month":
      start = startOfMonth(addMonths(now, -12));
      end = startOfMonth(addMonths(now, 36));
      break;
    case "year":
      start = startOfQuarter(addQuarters(now, -4));
      end = startOfQuarter(addQuarters(now, 12));
      break;
  }
  return { start, end };
}

function getColumns(zoom: ZoomLevel, start: Date, end: Date) {
  const cols: { date: Date; label: string }[] = [];
  let current = new Date(start);
  while (current <= end) {
    switch (zoom) {
      case "day":
        cols.push({ date: new Date(current), label: format(current, "d") });
        current = addDays(current, 1);
        break;
      case "week":
        cols.push({ date: new Date(current), label: format(current, "MMM d") });
        current = addWeeks(current, 1);
        break;
      case "month":
        cols.push({ date: new Date(current), label: format(current, "MMM yyyy") });
        current = addMonths(current, 1);
        break;
      case "year": {
        const q = Math.floor(current.getMonth() / 3) + 1;
        cols.push({ date: new Date(current), label: `Q${q} ${format(current, "yyyy")}` });
        current = addQuarters(current, 1);
        break;
      }
    }
  }
  return cols;
}

function dateToX(date: Date, zoom: ZoomLevel, rangeStart: Date, colWidth: number): number {
  switch (zoom) {
    case "day": return differenceInDays(date, rangeStart) * colWidth;
    case "week": return (differenceInDays(date, rangeStart) / 7) * colWidth;
    case "month": return (differenceInDays(date, rangeStart) / 30.44) * colWidth;
    case "year": return (differenceInDays(date, rangeStart) / 91.31) * colWidth;
  }
}

export default function GanttChart({
  cards, columns, boards, onCardClick, onCardUpdate,
  groupBy = "column", boardColorMap = {}
}: GanttChartProps) {
  const queryClient = useQueryClient();
  const zoomRef = useRef<ZoomLevel>("day");
  const [zoom, _setZoom] = useState<ZoomLevel>("day");
  const setZoom = useCallback((z: ZoomLevel) => { zoomRef.current = z; _setZoom(z); }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    cardId: string; type: "move" | "resize-left" | "resize-right";
    startX: number; origStart: string | null; origEnd: string | null;
    currentStart: string | null; currentEnd: string | null;
  } | null>(null);
  const dragRef = useRef(dragState);
  dragRef.current = dragState;
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; card: Card; showBoardSub: boolean } | null>(null);
  const [allBoards, setAllBoards] = useState<Board[]>(boards || []);
  const [filterBoardId, setFilterBoardId] = useState<string | null>(null);
  const initialScrollDone = useRef(false);
  const [showZones, setShowZones] = useState(() => {
    try { return localStorage.getItem("gantt_show_zones") === "true"; } catch { return false; }
  });
  const [unscheduledHeight, setUnscheduledHeight] = useState(() => {
    try { return parseInt(localStorage.getItem("gantt_unscheduled_height") || "200", 10); } catch { return 200; }
  });
  const unscheduledDragRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const [catSettings, setCatSettings] = useState<Record<string, number>>({ A: 7, B: 30, C: 90, D: 180 });
  const [optimisticDates, setOptimisticDates] = useState<Record<string, { start_date: string | null; due_date: string | null }>>({});
  const [tooltip, setTooltip] = useState<{ card: Card; x: number; y: number } | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (boards && boards.length > 0) { setAllBoards(boards); return; }
    fetchBoards().then(r => setAllBoards(r.boards)).catch(() => {});
  }, [boards]);

  // Clear optimistic dates once parent cards prop reflects the new values
  useEffect(() => {
    setOptimisticDates(prev => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const cardId of Object.keys(next)) {
        const card = cards.find(c => c.id === cardId);
        if (!card) { delete next[cardId]; changed = true; continue; }
        const opt = next[cardId];
        if (opt.start_date === card.start_date && opt.due_date === card.due_date) {
          delete next[cardId]; changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [cards]);

  // Fetch category settings for zones
  useEffect(() => {
    fetchManagerSettings().then(({ settings }) => {
      setCatSettings({
        A: parseInt(settings.cat_a_days || "7", 10),
        B: parseInt(settings.cat_b_days || "30", 10),
        C: parseInt(settings.cat_c_days || "90", 10),
        D: parseInt(settings.cat_d_days || "180", 10),
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent, card: Card) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, card, showBoardSub: false });
  }, []);

  const handleMoveToBoard = useCallback(async (card: Card, targetBoardId: string) => {
    try {
      const boardData = await fetchBoard(targetBoardId);
      const firstCol = boardData.columns.sort((a: Column, b: Column) => a.sort_order - b.sort_order)[0];
      if (!firstCol) return;
      await onCardUpdate(card.id, { board_id: targetBoardId, column_id: firstCol.id } as Partial<Card>);
    } catch {}
    setContextMenu(null);
  }, [onCardUpdate]);

  const colWidth = COL_WIDTHS[zoom];
  const { start: rangeStart, end: rangeEnd } = useMemo(() => getTimeRange(zoom), [zoom]);
  const timeCols = useMemo(() => getColumns(zoom, rangeStart, rangeEnd), [zoom, rangeStart, rangeEnd]);
  const totalWidth = timeCols.length * colWidth;

  // Scroll to today on initial mount only — position today 6 columns from the left
  useEffect(() => {
    if (!scrollRef.current || initialScrollDone.current) return;
    initialScrollDone.current = true;
    const todayX = dateToX(new Date(), zoom, rangeStart, colWidth);
    scrollRef.current.scrollLeft = todayX - 6 * colWidth;
  }, [zoom, rangeStart, colWidth]);

  // Re-center on zoom change — same 6-col-from-left offset
  const prevZoom = useRef(zoom);
  useEffect(() => {
    if (prevZoom.current === zoom) return;
    prevZoom.current = zoom;
    if (!scrollRef.current) return;
    const todayX = dateToX(new Date(), zoom, rangeStart, colWidth);
    scrollRef.current.scrollLeft = todayX - 6 * colWidth;
  }, [zoom, rangeStart, colWidth]);

  // Filter cards by board
  const filteredCards = filterBoardId ? cards.filter(c => c.board_id === filterBoardId) : cards;

  const scheduled = filteredCards.filter(c => c.start_date || c.due_date);
  const unscheduled = filteredCards.filter(c => !c.start_date && !c.due_date);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; color: string; cards: Card[]; boardId?: string }>();
    // When grouping by board, seed every board first so boards with no dated cards still appear
    if (groupBy === "board") {
      const boardsToShow = filterBoardId
        ? allBoards.filter(b => b.id === filterBoardId)
        : allBoards;
      for (const board of boardsToShow) {
        map.set(board.id, { label: board.name, color: board.color || "#00bcd4", cards: [], boardId: board.id });
      }
    }
    for (const card of scheduled) {
      let key: string, label: string, color: string, boardId: string | undefined;
      if (groupBy === "board") {
        const board = allBoards.find(b => b.id === card.board_id);
        key = card.board_id;
        label = board?.name || card.board_id;
        color = board?.color || "#00bcd4";
        boardId = card.board_id;
      } else {
        const col = columns?.find(c => c.id === card.column_id);
        key = card.column_id;
        label = col?.name || card.column_id;
        color = boardColorMap[card.board_id] || "#00bcd4";
      }
      if (!map.has(key)) map.set(key, { label, color, cards: [], boardId });
      map.get(key)!.cards.push(card);
    }
    return Array.from(map.values());
  }, [scheduled, groupBy, allBoards, columns, boardColorMap, filterBoardId]);

  const todayX = dateToX(new Date(), zoom, rangeStart, colWidth);

  // Drag handlers
  const dragged = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent, card: Card, type: "move" | "resize-left" | "resize-right") => {
    e.stopPropagation();
    e.preventDefault();
    dragged.current = false;
    setDragState({
      cardId: card.id, type, startX: e.clientX,
      origStart: card.start_date, origEnd: card.due_date,
      currentStart: card.start_date, currentEnd: card.due_date,
    });
  }, []);

  useEffect(() => {
    if (!dragState) return;
    const { startX, origStart, origEnd, type } = dragState;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 2) dragged.current = true;
      const currentZoom = zoomRef.current;
      const currentColWidth = COL_WIDTHS[currentZoom];
      const daysDelta = Math.round(dx / currentColWidth * (currentZoom === "day" ? 1 : currentZoom === "week" ? 7 : currentZoom === "month" ? 30.44 : 91.31));

      let newStart = origStart;
      let newEnd = origEnd;
      if (type === "move") {
        if (origStart) newStart = format(addDays(new Date(origStart), daysDelta), "yyyy-MM-dd");
        if (origEnd) newEnd = format(addDays(new Date(origEnd), daysDelta), "yyyy-MM-dd");
      } else if (type === "resize-left" && origStart) {
        newStart = format(addDays(new Date(origStart), daysDelta), "yyyy-MM-dd");
      } else if (type === "resize-right" && origEnd) {
        newEnd = format(addDays(new Date(origEnd), daysDelta), "yyyy-MM-dd");
      }
      setDragState(prev => prev ? { ...prev, currentStart: newStart, currentEnd: newEnd } : null);
    };

    const handleMouseUp = () => {
      const latest = dragRef.current;
      if (latest) {
        const updates: Partial<Card> = {};
        if (latest.currentStart !== latest.origStart) updates.start_date = latest.currentStart;
        if (latest.currentEnd !== latest.origEnd) updates.due_date = latest.currentEnd;
        if (Object.keys(updates).length > 0) {
          // Optimistically lock new dates so bar stays put while parent re-fetches
          setOptimisticDates(prev => ({
            ...prev,
            [latest.cardId]: { start_date: latest.currentStart, due_date: latest.currentEnd },
          }));
          setDragState(null);
          onCardUpdate(latest.cardId, updates).catch(() => {
            // Revert optimistic dates on failure
            setOptimisticDates(prev => { const n = { ...prev }; delete n[latest.cardId]; return n; });
          });
          return;
        }
      }
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, [dragState?.cardId, dragState?.startX, onCardUpdate]);

  const handleBarMouseEnter = useCallback((card: Card, e: React.MouseEvent) => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    tooltipTimerRef.current = setTimeout(() => setTooltip({ card, x, y }), 400);
  }, []);

  const handleBarMouseLeave = useCallback(() => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setTooltip(null);
  }, []);

  const handleBoardColorChange = useCallback(async (boardId: string, color: string) => {
    await updateBoard(boardId, { color });
    setAllBoards(prev => prev.map(b => b.id === boardId ? { ...b, color } : b));
    queryClient.invalidateQueries({ queryKey: ["boards"] });
  }, [queryClient]);

  const getBarColor = (card: Card, groupColor: string) => {
    if (card.color) return card.color;
    return groupColor;
  };

  const renderBar = (card: Card, color: string, rowIndex: number) => {
    const opt = optimisticDates[card.id];
    const cardStart = opt !== undefined ? opt.start_date : card.start_date;
    const cardEnd = opt !== undefined ? opt.due_date : card.due_date;
    const isDragging = dragState?.cardId === card.id;
    const startDate = isDragging ? dragState.currentStart : cardStart;
    const endDate = isDragging ? dragState.currentEnd : cardEnd;

    // Milestone: no start but has due
    if (!startDate && endDate) {
      const x = dateToX(new Date(endDate), zoom, rangeStart, colWidth);
      const barColor = card.color || color;
      return (
        <div key={card.id} className="absolute flex items-center gap-1 cursor-pointer"
          style={{ left: x - 6, top: rowIndex * ROW_HEIGHT + 4, height: ROW_HEIGHT - 8 }}
          onClick={() => onCardClick(card)}
          onContextMenu={(e) => handleContextMenu(e, card)}
          onMouseEnter={(e) => handleBarMouseEnter(card, e)}
          onMouseLeave={handleBarMouseLeave}
        >
          <div className="w-3 h-3 rotate-45" style={{ backgroundColor: barColor }} />
          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap truncate max-w-[120px]">{card.title}</span>
        </div>
      );
    }

    if (!startDate || !endDate) return null;

    const x1 = dateToX(new Date(startDate), zoom, rangeStart, colWidth);
    const x2 = dateToX(new Date(endDate), zoom, rangeStart, colWidth);
    const width = Math.max(x2 - x1, 8);
    const barColor = getBarColor(card, color);

    return (
      <div key={card.id} className="absolute group" style={{ left: x1, top: rowIndex * ROW_HEIGHT + 4, width, height: ROW_HEIGHT - 8 }}>
        {/* Left resize handle */}
        <div className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 hover:bg-white/20 rounded-l"
          onMouseDown={(e) => handleMouseDown(e, card, "resize-left")} />
        {/* Bar body */}
        <div className="h-full rounded cursor-pointer flex items-center px-2 overflow-hidden select-none"
          style={{ backgroundColor: barColor + "cc" }}
          onMouseDown={(e) => handleMouseDown(e, card, "move")}
          onClick={(e) => { if (!dragged.current) onCardClick(card); }}
          onContextMenu={(e) => handleContextMenu(e, card)}
          onMouseEnter={(e) => handleBarMouseEnter(card, e)}
          onMouseLeave={handleBarMouseLeave}
        >
          <span className="text-xs font-medium text-white truncate">{card.title}</span>
        </div>
        {/* Right resize handle */}
        <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10 hover:bg-white/20 rounded-r"
          onMouseDown={(e) => handleMouseDown(e, card, "resize-right")} />
        {/* Drag tooltip */}
        {isDragging && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded px-2 py-0.5 text-[10px] text-[var(--text-primary)] whitespace-nowrap z-20">
            {dragState.currentStart || "—"} → {dragState.currentEnd || "—"}
          </div>
        )}
      </div>
    );
  };

  let rowCounter = 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header with zoom toggle and board filter */}
      <div className="px-4 py-2 border-b border-[var(--border)] flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">Timeline</span>
          {/* Board filter — only show when grouping by board (global timeline) */}
          {groupBy === "board" && allBoards.length > 0 && (
            <select
              value={filterBoardId || ""}
              onChange={(e) => setFilterBoardId(e.target.value || null)}
              className="px-2 py-1 text-[11px] rounded-md bg-[var(--bg-sidebar)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[#00bcd4] focus:outline-none"
            >
              <option value="">All Boards</option>
              {allBoards.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Zones toggle */}
          <button
            onClick={() => {
              const next = !showZones;
              setShowZones(next);
              try { localStorage.setItem("gantt_show_zones", String(next)); } catch {}
            }}
            className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors border",
              showZones ? "bg-[#9c27b0]/20 text-[#9c27b0] border-[#9c27b0]/40" : "text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            )}
          >Zones</button>
          <div className="flex items-center gap-1 bg-[var(--bg-sidebar)] rounded-lg border border-[var(--border)] p-0.5">
            {ZOOM_LABELS.map(z => (
              <button key={z} onClick={() => setZoom(z)}
                className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors",
                  zoom === z ? "bg-[#00bcd4] text-[#0d1117]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                )}
              >{z.charAt(0).toUpperCase() + z.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt body */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto relative">
        <div style={{ width: totalWidth, minHeight: "100%" }} className="relative">
          {/* Time header */}
          <div className="sticky top-0 z-10 flex border-b border-[var(--border)] bg-[var(--bg-sidebar)]" style={{ width: totalWidth }}>
            {timeCols.map((col, i) => (
              <div key={i} className={cn("text-[10px] font-mono text-[var(--text-muted)] text-center py-1.5 shrink-0",
                isToday(col.date) && "text-[#00bcd4] font-bold"
              )} style={{ width: colWidth }}>{col.label}</div>
            ))}
          </div>

          {/* Category boundary lines */}
          {showZones && catSettings && (() => {
            const today = startOfDay(new Date());
            const adays = Number(catSettings.A || 7);
            const bdays = Number(catSettings.B || 30);
            const cdays = Number(catSettings.C || 90);
            const boundaries = [
              { label: "B", color: "#ff9800", x: dateToX(addDays(today, adays), zoom, rangeStart, colWidth) },
              { label: "C", color: "#2196f3", x: dateToX(addDays(today, adays + bdays), zoom, rangeStart, colWidth) },
              { label: "D", color: "#9c27b0", x: dateToX(addDays(today, adays + bdays + cdays), zoom, rangeStart, colWidth) },
            ];
            return boundaries.map(({ label, color, x }) => (
              <div key={label} style={{ position: "absolute", top: 0, bottom: 0, left: x, width: 0, pointerEvents: "none", zIndex: 4 }}>
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 1, background: color, opacity: 0.5 }} />
                <span style={{
                  position: "absolute", top: 2, left: 3,
                  fontSize: 9, fontWeight: 700, color, opacity: 0.85,
                  lineHeight: 1, userSelect: "none",
                }}>{label}</span>
              </div>
            ));
          })()}

          {/* Today line */}
          <div className="absolute top-0 bottom-0 w-px bg-[#4caf50] z-[5] pointer-events-none" style={{ left: todayX }} />

          {/* Rows */}
          <div className="relative">
            {groups.map((group) => {
              const section = (
                <div key={group.label}>
                  <div className="sticky left-0 z-[6] flex items-center gap-3 px-4 bg-[var(--bg-card)]/80"
                    style={{ height: ROW_HEIGHT, width: "fit-content", minWidth: "200px" }}>
                    <span className="text-sm font-medium text-[var(--text-muted)] truncate">{group.label}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">({group.cards.length})</span>
                  </div>
                  {rowCounter++}
                  <div className="relative" style={{ height: group.cards.length * ROW_HEIGHT }}>
                    {/* Group separator — full-width line at bottom of each board group */}
                    <div className="absolute" style={{ bottom: 0, left: 0, width: totalWidth, height: 1, backgroundColor: "#30363d", zIndex: 5 }} />
                    {group.cards.map((card, i) => {
                      const row = i;
                      return (
                        <div key={card.id}>
                          <div className="sticky left-0 z-[4] flex items-center gap-2 px-6 cursor-pointer hover:text-[var(--text-primary)]"
                            style={{ top: row * ROW_HEIGHT, height: ROW_HEIGHT, width: "fit-content", minWidth: "200px", position: "absolute" }}
                            onClick={() => onCardClick(card)}
                          >
                            <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[160px]">{card.title}</span>
                          </div>
                          {renderBar(card, group.color, row)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
              rowCounter += group.cards.length;
              return section;
            })}
          </div>
        </div>
      </div>

      {/* Unscheduled section */}
      {unscheduled.length > 0 && (
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg-primary)] overflow-y-auto" style={{ height: unscheduledHeight }}>
          {/* Drag-to-resize handle */}
          <div
            className="sticky top-0 z-[2] flex items-center justify-center bg-[var(--bg-hover)] hover:bg-[#3d4450] transition-colors"
            style={{ height: 8, cursor: "row-resize", flexShrink: 0 }}
            onMouseDown={(e) => {
              e.preventDefault();
              unscheduledDragRef.current = { startY: e.clientY, startHeight: unscheduledHeight };
              const onMove = (ev: MouseEvent) => {
                if (!unscheduledDragRef.current) return;
                const delta = unscheduledDragRef.current.startY - ev.clientY;
                const next = Math.min(600, Math.max(80, unscheduledDragRef.current.startHeight + delta));
                setUnscheduledHeight(next);
                try { localStorage.setItem("gantt_unscheduled_height", String(next)); } catch {}
              };
              const onUp = () => {
                unscheduledDragRef.current = null;
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          >
            <div className="w-8 h-0.5 rounded-full bg-[#8b949e] opacity-60" />
          </div>
          <div className="flex items-center gap-2 px-3 bg-[var(--bg-card)] border-b border-[var(--border)]/40 sticky top-2 z-[1]"
            style={{ height: ROW_HEIGHT }}>
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--bg-hover)] shrink-0" />
            <span className="text-[11px] font-semibold text-[var(--text-muted)]">Unscheduled</span>
            <span className="text-[10px] text-[var(--text-muted)]">({unscheduled.length})</span>
          </div>
          {unscheduled.map((card) => (
            <div key={card.id} className="flex items-center gap-2 px-6 cursor-pointer hover:bg-[var(--bg-card)]/50 border-b border-[var(--border)]/10"
              style={{ height: ROW_HEIGHT }} onClick={() => onCardClick(card)}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--bg-hover)] shrink-0" />
              <span className="text-sm text-[var(--text-muted)] truncate">{card.title}</span>
              <span className="text-xs text-[#30363d] italic ml-auto shrink-0">no dates</span>
            </div>
          ))}
        </div>
      )}
      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="fixed z-[100] bg-[var(--bg-elevated)] border border-[var(--border)] rounded px-2 py-1 text-xs text-white shadow-lg pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y - 4, transform: "translate(-50%, -100%)" }}
        >
          {tooltip.card.title}
        </div>
      )}
      {/* Context menu */}
      {contextMenu && (
        <div className="fixed z-50 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-xl py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            onClick={() => { onCardClick(contextMenu.card); setContextMenu(null); }}
          >
            Open card
          </button>
          <div className="relative">
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors flex items-center justify-between"
              onClick={(e) => { e.stopPropagation(); setContextMenu(prev => prev ? { ...prev, showBoardSub: !prev.showBoardSub } : null); }}
            >
              Move to board
              <span className="text-[var(--text-muted)] text-[10px]">▸</span>
            </button>
            {contextMenu.showBoardSub && (
              <div className="absolute left-full top-0 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-xl py-1 min-w-[140px] ml-1">
                {allBoards
                  .filter(b => b.id !== contextMenu.card.board_id)
                  .map(b => (
                    <button key={b.id}
                      className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors flex items-center gap-2"
                      onClick={() => handleMoveToBoard(contextMenu.card, b.id)}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                      {b.name}
                    </button>
                  ))}
                {allBoards.filter(b => b.id !== contextMenu.card.board_id).length === 0 && (
                  <span className="block px-3 py-1.5 text-xs text-[var(--text-muted)] italic">No other boards</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
