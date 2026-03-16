import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCardDrag } from "@/lib/manager/CardDragContext";
import { fetchBoard, updateCard, createCard, fetchChecklists, fetchBoardLabels, fetchCardLabels, deleteLabelApi } from "@/lib/manager/managerApi";
import { useCardTimer } from "@/lib/manager/CardTimerContext";
import type { Board, Card, Column, ChecklistItem, ViewMode, Label } from "@/lib/manager/types";
import ManageCard from "@/components/manager/ManageCard";
import ManageCardModal from "@/components/manager/ManageCardModal";
import BoardListView from "@/components/manager/BoardListView";
import BoardCalendarView from "@/components/manager/BoardCalendarView";
import GanttChart from "@/components/manager/GanttChart";
import MobileColumnView from "@/components/manager/MobileColumnView";
import { SkeletonColumn, SkeletonCard } from "@/components/manager/Skeletons";
import StorageOverlay from "@/components/manager/StorageOverlay";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus, LayoutGrid, List, Calendar, X, AlertTriangle, RefreshCw, FolderOpen, GanttChart as GanttChartIcon, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const stripEmoji = (s: string) => s.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();

const PRIORITY_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

function sortColCards(cards: import("@/lib/manager/types").Card[], colId: string): import("@/lib/manager/types").Card[] {
  return cards
    .filter((c) => c.column_id === colId)
    .sort((a, b) => {
      // 1. card_order ASC (nulls last)
      if (a.card_order !== null && b.card_order !== null) return a.card_order - b.card_order;
      if (a.card_order !== null) return -1;
      if (b.card_order !== null) return 1;
      // 2. priority A→B→C→D
      const pa = PRIORITY_ORDER[a.priority] ?? 3;
      const pb = PRIORITY_ORDER[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      // 3. start_date ASC (nulls last)
      const da = a.start_date ? new Date(a.start_date).getTime() : Infinity;
      const db = b.start_date ? new Date(b.start_date).getTime() : Infinity;
      return da - db;
    });
}

const boardTitles: Record<string, string> = {
  content: "Content Pipeline",
  platform: "ProvenAI Platform",
  funnel: "Funnel & Email",
  bizdev: "Business Development",
  strategy: "Strategy & Horizon",
};

const viewIcons: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: "kanban", icon: LayoutGrid, label: "Kanban" },
  { mode: "list", icon: List, label: "List" },
  { mode: "calendar", icon: Calendar, label: "Calendar" },
  { mode: "timeline", icon: GanttChartIcon, label: "Timeline" },
];

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const isMobile = useIsMobile();
  const { startTimer } = useCardTimer();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [cardLabelsMap, setCardLabelsMap] = useState<Record<string, Label[]>>({});
  const [filterLabelId, setFilterLabelId] = useState<string | null>(null);
  const [storageOpen, setStorageOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(`board-view-${boardId}`) as ViewMode) || "kanban";
  });

  // Card visual drag state
  const { setDragState, clearDragState, hoveredBoardId, hoveredBoardName } = useCardDrag();
  const navigate = useNavigate();

  // Undo stack — last 5 card moves
  interface UndoEntry {
    cardId: string;
    fromColumnId: string;
    fromBoardId: string;
    toColumnId: string;
    toBoardId: string;
    prevColCards: { id: string; card_order: number | null }[];
  }
  const undoStack = useRef<UndoEntry[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const pushUndo = (entry: UndoEntry) => {
    undoStack.current = [...undoStack.current.slice(-4), entry];
    setCanUndo(true);
  };

  const cardDragRef = useRef<{
    pointerId: number;
    cardId: string;
    colId: string;
    startX: number;
    startY: number;
    isDragging: boolean;
    clone: HTMLElement | null;
    placeholder: HTMLElement | null;
    sourceEl: HTMLElement | null;
    sidebarLabel: HTMLElement | null;
  } | null>(null);
  const cardItemRefs = useRef<Record<string, (HTMLDivElement | null)[]>>({});
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [vertDrag, setVertDrag] = useState<{ colId: string; insertIdx: number } | null>(null);

  useEffect(() => {
    if (boardId) localStorage.setItem(`board-view-${boardId}`, viewMode);
  }, [viewMode, boardId]);

  const load = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    setError(null);
    try {
      const [d, labelsRes] = await Promise.all([fetchBoard(boardId), fetchBoardLabels(boardId)]);
      const sortedCols = d.columns.sort((a, b) => a.sort_order - b.sort_order);
      setBoard(d.board ?? null);
      setColumns(sortedCols);
      setCards(d.cards);
      setBoardLabels(labelsRes.labels);

      const checklistMap: Record<string, ChecklistItem[]> = {};
      const clMap: Record<string, Label[]> = {};
      await Promise.allSettled(
        d.cards.flatMap((card) => [
          fetchChecklists(card.id).then(({ items }) => { if (items.length > 0) checklistMap[card.id] = items; }).catch(() => {}),
          fetchCardLabels(card.id).then(({ labels }) => { if (labels.length > 0) clMap[card.id] = labels; }).catch(() => {}),
        ])
      );
      setChecklists(checklistMap);
      setCardLabelsMap(clMap);
    } catch (e) {
      setError((e as Error)?.message || "Failed to load board");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => { load(); }, [load]);

  // Update clone label when hoveredBoardName changes (driven by ManagerLayout via context)
  useEffect(() => {
    const s = cardDragRef.current;
    if (!s?.clone) return;
    if (!hoveredBoardName) {
      if (s.sidebarLabel) { s.sidebarLabel.remove(); s.sidebarLabel = null; }
      return;
    }
    let label = s.sidebarLabel;
    if (!label) {
      label = document.createElement('div');
      label.style.cssText = 'position:absolute;bottom:-28px;left:0;right:0;text-align:center;background:#00bcd4;color:#0d1117;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;pointer-events:none;white-space:nowrap;z-index:10000;';
      s.clone.style.overflow = 'visible';
      s.clone.appendChild(label);
      s.sidebarLabel = label;
    }
    label.textContent = `\u2192 ${hoveredBoardName}`;
  }, [hoveredBoardName]);

  /* Card drag helpers */
  const getCardDropIdxFromY = useCallback((colId: string, clientY: number, excludeCardId?: string): number => {
    const refs = cardItemRefs.current[colId] || [];
    let best = 0;
    for (let i = 0; i < refs.length; i++) {
      const el = refs[i];
      if (!el) continue;
      // Skip the placeholder slot for the dragged card
      if (el.dataset.cardId === excludeCardId) continue;
      const rect = el.getBoundingClientRect();
      if (clientY > rect.top + rect.height / 2) best = i + 1;
    }
    return best;
  }, []);

  const getColumnAtPoint = useCallback((clientX: number, clientY: number): string | null => {
    // Temporarily hide clone so elementFromPoint sees the columns
    const clone = cardDragRef.current?.clone;
    // Ensure clone never intercepts the hit-test; keep pointer-events:none permanently.
    if (clone) clone.style.pointerEvents = "none";
    let el = document.elementFromPoint(clientX, clientY);
    while (el && el !== document.body) {
      for (const [colId, colEl] of columnRefs.current) {
        if (colEl === el || colEl.contains(el)) return colId;
      }
      el = el.parentElement;
    }
    return null;
  }, []);

  const cleanupDrag = useCallback(() => {
    const s = cardDragRef.current;
    if (!s) return;
    if (s.isDragging) clearDragState();
    if (s.clone) s.clone.remove();
    if (s.placeholder) s.placeholder.remove();
    if (s.sourceEl) s.sourceEl.style.visibility = "";
    cardDragRef.current = null;
    setVertDrag(null);
    setDragOverCol(null);
  }, [clearDragState]);

  const handleCardPointerDown = useCallback((e: React.PointerEvent, cardId: string, colId: string) => {
    if ((e.target as Element).closest("button,input,textarea,a,select")) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    cardDragRef.current = {
      pointerId: e.pointerId, cardId, colId,
      startX: e.clientX, startY: e.clientY,
      isDragging: false,
      clone: null, placeholder: null,
      sourceEl: e.currentTarget as HTMLElement,
      sidebarLabel: null,
    };
  }, []);

  const handleCardPointerMove = useCallback((e: React.PointerEvent) => {
    const s = cardDragRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;

    if (!s.isDragging) {
      if (Math.hypot(dx, dy) < 8) return;
      s.isDragging = true;

      // Create floating clone
      const srcRect = s.sourceEl!.getBoundingClientRect();
      const clone = s.sourceEl!.cloneNode(true) as HTMLElement;
      clone.style.cssText = [
        `position:fixed`,
        `left:${srcRect.left}px`,
        `top:${srcRect.top}px`,
        `width:${srcRect.width}px`,
        `height:${srcRect.height}px`,
        `margin:0`,
        `pointer-events:none`,
        `z-index:9999`,
        `opacity:0.92`,
        `box-shadow:0 8px 32px rgba(0,0,0,0.6)`,
        `transform:translate(0,0)`,
        `transition:none`,
        `border-color:#00bcd4`,
        `cursor:grabbing`,
      ].join(";");
      document.body.appendChild(clone);
      s.clone = clone;

      // Create placeholder
      const ph = document.createElement("div");
      ph.style.cssText = `height:${srcRect.height}px;border-radius:8px;background:rgba(0,188,212,0.08);border:1.5px dashed #00bcd4;pointer-events:none;`;
      s.sourceEl!.insertAdjacentElement("afterend", ph);
      s.placeholder = ph;
      s.sourceEl!.style.visibility = "hidden";
    }

    // Move clone
    if (s.clone) {
      s.clone.style.transform = `translate(${e.clientX - s.startX}px, ${e.clientY - s.startY}px)`;
    }

    // Sidebar detection — only highlight when cursor is physically over the sidebar
    const sidebarEl = document.querySelector('aside');
    const sidebarRight = sidebarEl ? sidebarEl.getBoundingClientRect().right : 260;
    const nowInSidebar = e.clientX <= sidebarRight;

    if (nowInSidebar) {
      // Notify context so ManagerLayout can compute hoveredBoardId
      setDragState({ isDragging: true, dragX: e.clientX, dragY: e.clientY, cardId: s.cardId, cardTitle: null });
      setDragOverCol(null);
      setVertDrag(null);
      return;
    }

    // Cursor is over the main content area — clear any sidebar highlight
    clearDragState();

    // Left the sidebar — clean up label if present
    if (s.sidebarLabel) { s.sidebarLabel.remove(); s.sidebarLabel = null; }

    // Detect target column
    const targetColId = getColumnAtPoint(e.clientX, e.clientY);
    setDragOverCol(targetColId);

    if (targetColId) {
      const insertIdx = getCardDropIdxFromY(targetColId, e.clientY, s.cardId);
      setVertDrag({ colId: targetColId, insertIdx });
    } else {
      setVertDrag(null);
    }
  }, [getCardDropIdxFromY, getColumnAtPoint, setDragState, clearDragState]);

  /* Optimistic drag & drop */
  const handleMoveCard = useCallback(async (cardId: string, newColumnId: string) => {
    const prevCards = [...cards];
    const movedCard = cards.find((c) => c.id === cardId);
    if (!movedCard) return;
    // Save undo entry before mutating
    const prevColCards = sortColCards(prevCards, movedCard.column_id).map((c) => ({ id: c.id, card_order: c.card_order }));
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, column_id: newColumnId } : c)));
    setDragOverCol(null);
    // Start card timer on move
    startTimer({ id: movedCard.id, title: movedCard.title }, boardId || "", board?.name ?? "");
    // Fire-and-forget card activity event
    fetch("/api/manage/card-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: movedCard.id,
        card_title: movedCard.title,
        board_id: boardId || "",
        board_name: board?.name ?? "",
        event_type: "moved",
      }),
    }).catch(() => {});
    try {
      await updateCard(cardId, { column_id: newColumnId });
      pushUndo({
        cardId,
        fromColumnId: movedCard.column_id,
        fromBoardId: boardId || "",
        toColumnId: newColumnId,
        toBoardId: boardId || "",
        prevColCards,
      });
    } catch {
      setCards(prevCards);
      toast({ title: "Failed to save", description: "Changes may not persist", variant: "destructive" });
    }
  }, [cards, board, boardId, startTimer]);

  const handleCardPointerUp = useCallback(async (e: React.PointerEvent) => {
    const s = cardDragRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const wasDragging = s.isDragging;
    const { cardId, colId } = s;

    if (wasDragging && hoveredBoardId) {
      const sidebarEl = document.querySelector('aside');
      const sidebarRight = sidebarEl ? sidebarEl.getBoundingClientRect().right : 260;
      const releasedInSidebar = e.clientX <= sidebarRight;
      if (releasedInSidebar) {
        // Same board — treat as a no-op
        if (hoveredBoardId === boardId) {
          cleanupDrag();
          return;
        }
        const targetBoardId = hoveredBoardId;
        const movedCard = cards.find((c) => c.id === cardId);
        const prevColCards = movedCard ? sortColCards(cards, movedCard.column_id).map((c) => ({ id: c.id, card_order: c.card_order })) : [];
        cleanupDrag();
        setCards((prev) => prev.filter((c) => c.id !== cardId));
        try {
          const boardData = await fetchBoard(targetBoardId);
          const firstCol = [...boardData.columns].sort((a, b) => a.sort_order - b.sort_order)[0];
          if (firstCol) {
            await updateCard(cardId, { board_id: targetBoardId, column_id: firstCol.id });
            const boardName = boardData.board?.name ? boardData.board.name : targetBoardId;
            toast({ title: `Card moved to ${boardName}` });
            if (movedCard) {
              pushUndo({
                cardId,
                fromColumnId: movedCard.column_id,
                fromBoardId: boardId || "",
                toColumnId: firstCol.id,
                toBoardId: targetBoardId,
                prevColCards,
              });
            }
          }
        } catch {
          toast({ title: 'Failed to move card', variant: 'destructive' });
        }
        return;
      }
      // Released outside the sidebar — fall through to normal column-drop logic
    }

    const targetColId = getColumnAtPoint(e.clientX, e.clientY);
    const insertIdx = targetColId ? getCardDropIdxFromY(targetColId, e.clientY, cardId) : 0;
    cleanupDrag();

    if (!wasDragging) {
      const clickedCard = cards.find((c) => c.id === cardId);
      if (clickedCard) setEditCard(clickedCard);
      return;
    }

    if (!targetColId) return;

    // No-op: dropped back on the same column with no position change
    if (targetColId === colId && insertIdx === getCardDropIdxFromY(colId, e.clientY, cardId)) {
      const colCards = sortColCards(cards, colId);
      const fromIdx = colCards.findIndex((c) => c.id === cardId);
      if (fromIdx !== -1 && (insertIdx === fromIdx || insertIdx === fromIdx + 1)) return;
    }

    if (targetColId !== colId) {
      // Cross-column move
      handleMoveCard(cardId, targetColId);
    } else {
      // Same-column reorder
      const colCards = sortColCards(cards, colId);
      const fromIdx = colCards.findIndex((c) => c.id === cardId);
      if (fromIdx === -1 || insertIdx === fromIdx || insertIdx === fromIdx + 1) return;
      const next = [...colCards];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(insertIdx > fromIdx ? insertIdx - 1 : insertIdx, 0, moved);
      setCards((prev) => {
        const copy = [...prev];
        next.forEach((c, i) => {
          const idx = copy.findIndex((nc) => nc.id === c.id);
          if (idx !== -1) copy[idx] = { ...copy[idx], card_order: i };
        });
        return copy;
      });
      next.forEach((c, i) => updateCard(c.id, { card_order: i }).catch(() => {}));
    }
  }, [cards, getCardDropIdxFromY, getColumnAtPoint, cleanupDrag, handleMoveCard, hoveredBoardId, navigate]);

  const handleCardPointerCancel = useCallback(() => {
    cleanupDrag();
  }, [cleanupDrag]);

  /* Optimistic card creation */
  const handleAddCard = async (columnId: string) => {
    if (!newTitle.trim() || !boardId) return;
    const tempId = `temp-${Date.now()}`;
    const optimisticCard: Card = {
      id: tempId, board_id: boardId, column_id: columnId, title: newTitle.trim(),
      priority: "D", assignee: "jeff", description: null, due_date: null,
      content_type: null, card_type: null, platform: null, sort_order: 999, card_order: null,
      warning_hours: 48, start_date: null, color: null, category: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setCards((prev) => [...prev, optimisticCard]);
    setNewTitle("");
    setAddingTo(null);
    try {
      await createCard({ board_id: boardId, column_id: columnId, title: optimisticCard.title, priority: "D", assignee: "jeff" });
      load();
    } catch {
      setCards((prev) => prev.filter((c) => c.id !== tempId));
      toast({ title: "Failed to save", description: "Card could not be created", variant: "destructive" });
    }
  };

  /* Loading state with skeletons */
  if (loading) {
    return (
      <div className="h-screen flex flex-col min-w-0">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] shrink-0">
          <div className="h-6 bg-[var(--bg-hover)] rounded w-48 animate-pulse mb-2" />
          <div className="h-4 bg-[var(--bg-hover)] rounded w-32 animate-pulse" />
        </div>
        {isMobile ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto p-4">
            <div className="flex gap-4 h-full min-w-max">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonColumn key={i} />)}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* Error state */
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="rounded-lg border-2 border-[#f85149]/40 bg-[#f85149]/5 p-8 text-center max-w-md">
          <AlertTriangle className="h-8 w-8 text-[#f85149] mx-auto mb-3" />
          <p className="text-[var(--text-primary)] font-semibold mb-1">Failed to load board</p>
          <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
          <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#f85149]/20 text-[#f85149] text-sm font-semibold hover:bg-[#f85149]/30 transition-colors">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col min-w-0">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 min-w-0">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] truncate">
            {board ? stripEmoji(board.name) : (boardTitles[boardId || ""] || boardId)}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 sm:mt-1">
            {cards.length} card{cards.length !== 1 ? "s" : ""} across {columns.length} columns
          </p>
        </div>

        {!isMobile && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              disabled={!canUndo}
              onClick={async () => {
                const entry = undoStack.current.pop();
                setCanUndo(undoStack.current.length > 0);
                if (!entry) return;
                try {
                  await updateCard(entry.cardId, { board_id: entry.fromBoardId, column_id: entry.fromColumnId });
                  // Restore previous card_order values for the source column
                  await Promise.all(
                    entry.prevColCards.map((c) => updateCard(c.id, { card_order: c.card_order ?? 0 }))
                  );
                  setCards((prev) => {
                    // If the card was moved cross-board it won't be in prev — add it back
                    const exists = prev.some((c) => c.id === entry.cardId);
                    const base = exists
                      ? prev.map((c) => c.id === entry.cardId ? { ...c, column_id: entry.fromColumnId, board_id: entry.fromBoardId } : c)
                      : [...prev, { ...prev[0], id: entry.cardId, column_id: entry.fromColumnId, board_id: entry.fromBoardId }];
                    return base.map((c) => {
                      const saved = entry.prevColCards.find((p) => p.id === c.id);
                      return saved ? { ...c, card_order: saved.card_order } : c;
                    });
                  });
                  toast({ title: "Move undone" });
                } catch {
                  toast({ title: "Undo failed", variant: "destructive" });
                }
              }}
              title="Undo last move"
              className={cn(
                "p-2 rounded-md transition-colors border",
                canUndo
                  ? "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  : "border-transparent text-[var(--text-muted)] opacity-30 cursor-not-allowed"
              )}
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1 bg-[var(--bg-sidebar)] rounded-lg border border-[var(--border)] p-1">
              {viewIcons.map(({ mode, icon: Icon, label }) => (
                <button key={mode} onClick={() => setViewMode(mode)} title={label}
                  className={cn("p-2 rounded-md transition-colors", viewMode === mode ? "bg-[#00bcd4] text-[#0d1117]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]")}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Label filter bar */}
      {boardLabels.length > 0 && (
        <div className="px-4 sm:px-6 py-2 border-b border-[var(--border)] flex items-center gap-2 flex-wrap shrink-0">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mr-1">Filter:</span>
          {boardLabels.map((l) => (
            <span key={l.id} className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all border",
              filterLabelId === l.id ? "text-white border-white/30 shadow-[0_0_6px_rgba(255,255,255,0.15)]" : "text-white/70 border-transparent hover:border-white/20"
            )} style={{ backgroundColor: filterLabelId === l.id ? l.color : `${l.color}99` }}>
              <button onClick={() => setFilterLabelId(filterLabelId === l.id ? null : l.id)}>{l.name}</button>
              <button
                onClick={() => {
                  if (!boardId) return;
                  deleteLabelApi(boardId, l.id).catch(() => {});
                  setBoardLabels((prev) => prev.filter((x) => x.id !== l.id));
                  if (filterLabelId === l.id) setFilterLabelId(null);
                }}
                className="ml-0.5 opacity-60 hover:opacity-100"
                title="Delete label"
              ><X className="h-2.5 w-2.5" /></button>
            </span>
          ))}
          {filterLabelId && (
            <button onClick={() => setFilterLabelId(null)} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-0.5 ml-1">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Mobile: single-column view */}
      {isMobile && (
        <MobileColumnView cards={cards} columns={columns} checklists={checklists} cardLabelsMap={cardLabelsMap}
          filterLabelId={filterLabelId} onCardClick={(card) => setEditCard(card)} onMoveCard={handleMoveCard} />
      )}

      {/* Desktop Kanban */}
      {!isMobile && viewMode === "kanban" && (
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((col) => {
              const colCards = sortColCards(cards, col.id)
                .filter((c) => !filterLabelId || cardLabelsMap[c.id]?.some((l) => l.id === filterLabelId));
              const isOver = dragOverCol === col.id;
              // Ensure ref array is sized correctly for this column
              cardItemRefs.current[col.id] = cardItemRefs.current[col.id] ?? [];
              cardItemRefs.current[col.id].length = colCards.length;

              return (
                <div key={col.id}
                  ref={(el) => { if (el) columnRefs.current.set(col.id, el); else columnRefs.current.delete(col.id); }}
                  className={cn("w-72 flex-shrink-0 rounded-lg border flex flex-col transition-colors",
                    isOver ? "bg-[var(--bg-elevated)] border-[#00bcd4] shadow-[0_0_0_1px_#00bcd4]" : "bg-[var(--bg-sidebar)] border-[var(--border)]"
                  )}
                >
                  <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{stripEmoji(col.name)}</span>
                    <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full">{colCards.length}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {colCards.map((card, idx) => (
                      <div key={card.id}>
                        {/* Insertion line before this card */}
                        {vertDrag?.colId === col.id && vertDrag.insertIdx === idx && (
                          <div className="h-0.5 bg-[#00bcd4] rounded mx-1 mb-1 shrink-0" />
                        )}
                        <div
                          data-card-id={card.id}
                          ref={(el) => { cardItemRefs.current[col.id][idx] = el; }}
                          onPointerDown={(e) => handleCardPointerDown(e, card.id, col.id)}
                          onPointerMove={handleCardPointerMove}
                          onPointerUp={handleCardPointerUp}
                          onPointerCancel={handleCardPointerCancel}
                        >
                          <ManageCard card={card} checklist={checklists[card.id]} labels={cardLabelsMap[card.id]}
                            onClick={() => setEditCard(card)} />
                        </div>
                      </div>
                    ))}
                    {/* Insertion line after last card */}
                    {vertDrag?.colId === col.id && vertDrag.insertIdx === colCards.length && (
                      <div className="h-0.5 bg-[#00bcd4] rounded mx-1 shrink-0" />
                    )}
                    {/* Empty column state */}
                    {colCards.length === 0 && !isOver && (
                      <button onClick={() => { setAddingTo(col.id); setNewTitle(""); }}
                        className="w-full py-8 rounded-lg border-2 border-dashed border-[var(--border)] text-[var(--text-muted)] flex flex-col items-center gap-2 hover:border-[#00bcd4]/40 hover:text-[var(--text-primary)] transition-colors">
                        <Plus className="h-5 w-5" />
                        <span className="text-xs">Add a card</span>
                      </button>
                    )}
                  </div>

                  <div className="p-2 border-t border-[var(--border)]">
                    {addingTo === col.id ? (
                      <div className="space-y-2">
                        <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddCard(col.id); if (e.key === "Escape") setAddingTo(null); }}
                          placeholder="Card title..."
                          className="w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#00bcd4] focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleAddCard(col.id)} className="px-3 py-1.5 rounded-md bg-[#00bcd4] text-[#0d1117] text-xs font-semibold">Add</button>
                          <button onClick={() => setAddingTo(null)} className="px-3 py-1.5 rounded-md text-[var(--text-muted)] text-xs hover:text-[var(--text-primary)]">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingTo(col.id); setNewTitle(""); }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors">
                        <Plus className="h-4 w-4" /> Add card
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty board state */}
      {!isMobile && cards.length === 0 && !loading && viewMode === "kanban" && columns.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-primary)] font-semibold mb-1">No cards yet</p>
            <p className="text-sm text-[var(--text-muted)] mb-4">Add your first card to get started</p>
          </div>
        </div>
      )}

      {!isMobile && viewMode === "list" && (
        <div className="flex-1 overflow-y-auto">
          <BoardListView cards={filterLabelId ? cards.filter((c) => cardLabelsMap[c.id]?.some((l) => l.id === filterLabelId)) : cards}
            columns={columns} checklists={checklists} onCardClick={(card) => setEditCard(card)} />
        </div>
      )}

      {!isMobile && viewMode === "calendar" && (
        <div className="flex-1 overflow-y-auto">
          <BoardCalendarView cards={filterLabelId ? cards.filter((c) => cardLabelsMap[c.id]?.some((l) => l.id === filterLabelId)) : cards}
            columns={columns} onCardClick={(card) => setEditCard(card)}
            onCardUpdate={async (id, updates) => {
              const prev = cards.find(c => c.id === id);
              setCards(cs => cs.map(c => c.id === id ? { ...c, ...updates } : c));
              try {
                await updateCard(id, updates);
              } catch {
                if (prev) setCards(cs => cs.map(c => c.id === id ? prev : c));
                toast({ title: "Save failed", description: "Card dates could not be saved", variant: "destructive" });
              }
            }}
          />
        </div>
      )}

      {!isMobile && viewMode === "timeline" && (
        <div className="flex-1 overflow-hidden">
          <GanttChart
            cards={filterLabelId ? cards.filter((c) => cardLabelsMap[c.id]?.some((l) => l.id === filterLabelId)) : cards}
            columns={columns}
            onCardClick={(card) => setEditCard(card)}
            onCardUpdate={async (id, updates) => {
              const prev = cards.find(c => c.id === id);
              setCards(cs => cs.map(c => c.id === id ? { ...c, ...updates } : c));
              try {
                await updateCard(id, updates);
              } catch {
                if (prev) setCards(cs => cs.map(c => c.id === id ? prev : c));
                toast({ title: "Save failed", description: "Card dates could not be saved", variant: "destructive" });
              }
            }}
          />
        </div>
      )}

      {editCard && (
        <ManageCardModal card={editCard} columns={columns} boardId={boardId || ""} boardName={board?.name ?? ""}
          onClose={() => setEditCard(null)} onSaved={() => { setEditCard(null); load(); }} />
      )}

      {/* Floating Storage button */}
      {!isMobile && (
        <button onClick={() => setStorageOpen(true)}
          className="fixed bottom-6 left-6 z-30 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[#00bcd4] hover:border-[#00bcd4]/40 shadow-lg transition-colors"
          title="Open Storage">
          <FolderOpen className="h-4 w-4" />
          <span className="text-xs font-mono">Storage</span>
        </button>
      )}
      <StorageOverlay open={storageOpen} onClose={() => setStorageOpen(false)} />
    </div>
  );
}
