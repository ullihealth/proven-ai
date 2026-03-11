import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchAllCards, fetchBoard, deleteCard, updateCard, fetchManagerSettings } from "@/lib/manager/managerApi";
import type { Card, Column } from "@/lib/manager/types";
import { CATEGORY_COLORS } from "@/lib/manager/types";
import { getRagStatus, ragDotColor } from "@/lib/manager/ragStatus";
import ManageCardModal from "@/components/manager/ManageCardModal";
import { SkeletonRow } from "@/components/manager/Skeletons";
import { cn } from "@/lib/utils";
import { RefreshCw, AlertTriangle, Trash2, GanttChart as GanttChartIcon } from "lucide-react";
import { format, addDays } from "date-fns";

const boardNames: Record<string, string> = {
  content: "Content Pipeline",
  platform: "ProvenAI Platform",
  funnel: "Funnel & Email",
  bizdev: "Business Dev",
  strategy: "Strategy & Horizon",
};

const priorityOrder: Record<string, number> = { critical: 0, this_week: 1, backlog: 2 };

const priorityConfig: Record<string, { label: string; class: string }> = {
  critical: { label: "Priority", class: "text-[#f85149] bg-[#f85149]/10 border-[#f85149]/30" },
  this_week: { label: "This Week", class: "text-[#00bcd4] bg-[#00bcd4]/10 border-[#00bcd4]/30" },
  backlog: { label: "Backlog", class: "text-[var(--text-muted)] bg-[#a0aab8]/10 border-[#a0aab8]/30" },
};

const assigneeConfig: Record<string, { initials: string; color: string }> = {
  jeff: { initials: "JT", color: "bg-[#00bcd4]" },
  wife: { initials: "A", color: "bg-[#e91e8c]" },
};

const doneColumns = ["content-published", "platform-live", "funnel-active", "funnel-archived", "bizdev-active", "strategy-decided", "strategy-archived"];

type AssigneeFilter = "all" | "jeff" | "wife";
type BoardFilter = "all" | string;
type ViewMode = "time" | "category";

export default function FocusPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>("all");
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [columnsMap, setColumnsMap] = useState<Record<string, Column[]>>({});
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>(() => searchParams.get("view") === "category" ? "category" : "time");
  const [catSettings, setCatSettings] = useState<Record<string, string>>({});
  const [dragOverLane, setDragOverLane] = useState<string | null>(null);
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [dragSourceLane, setDragSourceLane] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchAllCards(),
      fetchManagerSettings().catch(() => ({ settings: {} })),
    ])
      .then(async ([d, s]) => {
        const settings = s.settings as Record<string, string>;
        setCatSettings(settings);

        // Backfill: set placeholder dates on categorised cards missing them
        const catADays = Number(settings.cat_a_days || 3);
        const catBDays = Number(settings.cat_b_days || 7);
        const catCDays = Number(settings.cat_c_days || 30);
        const catDDays = Number(settings.cat_d_days || 90);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        function getPlaceholderDates(category: string): { start_date: string; due_date: string } | undefined {
          // Cat A: tomorrow → tomorrow + 1 (2 days)
          if (category === "A") {
            return {
              start_date: format(addDays(today, 1), "yyyy-MM-dd"),
              due_date: format(addDays(today, 2), "yyyy-MM-dd"),
            };
          }
          // Cat B: today + catADays → start + 1 (2 days)
          if (category === "B") {
            return {
              start_date: format(addDays(today, catADays), "yyyy-MM-dd"),
              due_date: format(addDays(today, catADays + 1), "yyyy-MM-dd"),
            };
          }
          // Cat C: today + catADays + catBDays → start + 1 (2 days)
          if (category === "C") {
            return {
              start_date: format(addDays(today, catADays + catBDays), "yyyy-MM-dd"),
              due_date: format(addDays(today, catADays + catBDays + 1), "yyyy-MM-dd"),
            };
          }
          // Cat D: today + catADays + catBDays + catCDays → start + 1 (2 days)
          if (category === "D") {
            return {
              start_date: format(addDays(today, catADays + catBDays + catCDays), "yyyy-MM-dd"),
              due_date: format(addDays(today, catADays + catBDays + catCDays + 1), "yyyy-MM-dd"),
            };
          }
        }

        // Only backfill cards where BOTH start_date AND due_date are null/empty
        const toBackfill = d.cards.filter(
          (c: Card) => c.category && !c.start_date && !c.due_date
        );
        for (const c of toBackfill) {
          const dates = getPlaceholderDates(c.category!);
          if (!dates) continue;
          try {
            await updateCard(c.id, { start_date: dates.start_date, due_date: dates.due_date });
            c.start_date = dates.start_date;
            c.due_date = dates.due_date;
          } catch {}
        }

        setCards(d.cards);
      })
      .catch((e) => setError(e?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCardClick = async (card: Card) => {
    if (!columnsMap[card.board_id]) {
      try {
        const data = await fetchBoard(card.board_id);
        setColumnsMap((prev) => ({ ...prev, [card.board_id]: data.columns }));
      } catch {
        setColumnsMap((prev) => ({ ...prev, [card.board_id]: [] }));
      }
    }
    setEditCard(card);
  };

  const handleDelete = async (cardId: string) => {
    setFadingOut((prev) => new Set(prev).add(cardId));
    try {
      await deleteCard(cardId);
      setTimeout(() => {
        setCards((prev) => prev.filter((c) => c.id !== cardId));
        setFadingOut((prev) => { const s = new Set(prev); s.delete(cardId); return s; });
      }, 300);
    } catch {
      setFadingOut((prev) => { const s = new Set(prev); s.delete(cardId); return s; });
    }
  };

  const active = cards
    .filter((c) => !doneColumns.includes(c.column_id))
    .filter((c) => assigneeFilter === "all" || c.assignee === assigneeFilter)
    .filter((c) => boardFilter === "all" || c.board_id === boardFilter);

  const categorize = (cards: Card[]) => {
    const red: Card[] = [];
    const amber: Card[] = [];
    const green: Card[] = [];
    const unscheduled: Card[] = [];

    for (const c of cards) {
      const rag = getRagStatus(c);
      if (!c.due_date) unscheduled.push(c);
      else if (rag === "red") red.push(c);
      else if (rag === "amber") amber.push(c);
      else green.push(c);
    }

    red.sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
    amber.sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
    green.sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
    unscheduled.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));

    return { red, amber, green, unscheduled };
  };

  const categorizeByCat = (cards: Card[]) => {
    const lanes: Record<string, Card[]> = { A: [], B: [], C: [], D: [], uncategorised: [] };
    for (const c of cards) {
      const cat = c.category;
      if (cat && lanes[cat]) lanes[cat].push(c);
      else lanes.uncategorised.push(c);
    }
    // Sort each lane by category_order ASC (nulls last), then due_date, then priority
    for (const key of Object.keys(lanes)) {
      lanes[key].sort((a, b) => {
        const ao = a.category_order == null ? Number.MAX_SAFE_INTEGER : a.category_order;
        const bo = b.category_order == null ? Number.MAX_SAFE_INTEGER : b.category_order;
        if (ao !== bo) return ao - bo;
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      });
    }
    return lanes;
  };

  const handleCategoryDrop = async (targetCat: string) => {
    if (!dragCardId) return;
    const card = cards.find(c => c.id === dragCardId);
    if (!card) return;

    const newCategory = targetCat === "uncategorised" ? null : targetCat as Card["category"];
    const updates: Partial<Card> = { category: newCategory };

    // If card has no dates AND dropping onto a real category, assign placeholder dates
    if (newCategory && !card.start_date && !card.due_date) {
      const daysKey = `cat_${newCategory.toLowerCase()}_days`;
      const days = parseInt(catSettings[daysKey] || "30", 10);
      const today = new Date();
      updates.start_date = format(today, "yyyy-MM-dd");
      updates.due_date = format(addDays(today, days), "yyyy-MM-dd");
    }

    // Optimistic update
    setCards(prev => prev.map(c => c.id === dragCardId ? { ...c, ...updates } : c));
    setDragCardId(null);
    setDragSourceLane(null);
    setDragOverLane(null);

    try {
      await updateCard(dragCardId, updates);
    } catch {
      load(); // rollback
    }
  };

  const { red, amber, green, unscheduled } = categorize(active);
  const catLanes = categorizeByCat(active);

  const handleReorder = async (laneKey: string, dragId: string, beforeId: string | null) => {
    const lane = catLanes[laneKey];
    if (!lane || !dragId) return;
    const newList = lane.filter(c => c.id !== dragId);
    const idx = beforeId != null ? newList.findIndex(c => c.id === beforeId) : newList.length;
    const dragged = lane.find(c => c.id === dragId);
    if (!dragged) return;
    newList.splice(idx >= 0 ? idx : newList.length, 0, dragged);
    // Optimistic update
    setCards(prev => {
      const orderMap = new Map(newList.map((c, i) => [c.id, i]));
      return prev.map(c => orderMap.has(c.id) ? { ...c, category_order: orderMap.get(c.id)! } : c);
    });
    setDragCardId(null);
    setDragSourceLane(null);
    // PATCH all cards in the lane with their new order
    for (let i = 0; i < newList.length; i++) {
      try { await updateCard(newList[i].id, { category_order: i }); } catch {}
    }
  };

  const selectClass = "px-3 py-1.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[#00bcd4] focus:outline-none appearance-none";
  const boards = [...new Set(cards.map((c) => c.board_id))];

  const catDays = {
    A: catSettings.cat_a_days || "7",
    B: catSettings.cat_b_days || "30",
    C: catSettings.cat_c_days || "90",
    D: catSettings.cat_d_days || "180",
  };

  const categoryLanes = [
    { key: "A", label: `🟢 Category A — complete within ${catDays.A} days`, color: CATEGORY_COLORS.A },
    { key: "B", label: `🟠 Category B — complete within ${catDays.B} days`, color: CATEGORY_COLORS.B },
    { key: "C", label: `🔵 Category C — complete within ${catDays.C} days`, color: CATEGORY_COLORS.C },
    { key: "D", label: `🟣 Category D — complete within ${catDays.D} days`, color: CATEGORY_COLORS.D },
    { key: "uncategorised", label: "⚪ Uncategorised", color: "#a0aab8" },
  ];

  return (
    <div className="px-6 lg:px-10 py-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Focus</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-sidebar)] rounded-lg border border-[var(--border)] p-0.5">
            <button onClick={() => setViewMode("time")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                viewMode === "time" ? "bg-[#00bcd4] text-[#0d1117]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}>Time Sensitive</button>
            <button onClick={() => setViewMode("category")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                viewMode === "category" ? "bg-[#00bcd4] text-[#0d1117]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}>Category View</button>
          </div>
          <button
            onClick={() => navigate("/manage/timeline")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[#00bcd4] transition-colors"
            title="View Timeline"
          >
            <GanttChartIcon className="h-3.5 w-3.5" />
            Timeline
          </button>
          <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value as AssigneeFilter)} className={selectClass}>
            <option value="all">Assignees</option>
            <option value="jeff">Jeff</option>
            <option value="wife">Aneta</option>
          </select>
          <select value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)} className={selectClass}>
            <option value="all">All Boards</option>
            {boards.map((b) => <option key={b} value={b}>{boardNames[b] || b}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-lg border-2 border-[#f85149]/40 bg-[#f85149]/5 p-8 text-center max-w-md">
            <AlertTriangle className="h-8 w-8 text-[#f85149] mx-auto mb-3" />
            <p className="text-[var(--text-primary)] font-semibold mb-1">Failed to load</p>
            <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
            <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#f85149]/20 text-[#f85149] text-sm font-semibold hover:bg-[#f85149]/30 transition-colors">
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && viewMode === "time" && (
        <>
          <Zone title="🔴 Red Zone — Overdue" cards={red} onCardClick={handleCardClick} onDelete={handleDelete} fadingOut={fadingOut} emptyMsg="No overdue cards" />
          <Zone title="🟠 Amber Zone — Due Soon" cards={amber} onCardClick={handleCardClick} onDelete={handleDelete} fadingOut={fadingOut} emptyMsg="Nothing due soon" />
          <Zone title="🟢 Green Zone — Upcoming" cards={green} onCardClick={handleCardClick} onDelete={handleDelete} fadingOut={fadingOut} emptyMsg="No upcoming deadlines" />
          <Zone title="⚪ Unscheduled" cards={unscheduled} onCardClick={handleCardClick} onDelete={handleDelete} fadingOut={fadingOut} emptyMsg="All cards have due dates" />
        </>
      )}

      {!loading && !error && viewMode === "category" && (
        <>
          {categoryLanes.map(({ key, label, color }) => (
            <CategoryLane
              key={key}
              laneKey={key}
              title={label}
              color={color}
              cards={catLanes[key] || []}
              onCardClick={handleCardClick}
              onDelete={handleDelete}
              fadingOut={fadingOut}
              isDragOver={dragOverLane === key}
              onDragOver={(e) => { e.preventDefault(); setDragOverLane(key); }}
              onDragLeave={() => setDragOverLane(null)}
              onDrop={() => handleCategoryDrop(key)}
              onDragStartCard={(id) => { setDragCardId(id); setDragSourceLane(key); }}
              dragCardId={dragCardId}
              dragSourceLane={dragSourceLane}
              onReorderDrop={(beforeId) => { if (dragCardId) handleReorder(key, dragCardId, beforeId); }}
            />
          ))}
        </>
      )}

      {editCard && (
        <ManageCardModal
          card={editCard}
          columns={columnsMap[editCard.board_id] || []}
          boardId={editCard.board_id}
          onClose={() => setEditCard(null)}
          onSaved={() => { setEditCard(null); load(); }}
        />
      )}
    </div>
  );
}

/* Time-sensitive zone (existing) */
function Zone({ title, cards, onCardClick, onDelete, fadingOut, emptyMsg }: {
  title: string; cards: Card[]; onCardClick: (c: Card) => void; onDelete: (id: string) => void; fadingOut: Set<string>; emptyMsg: string;
}) {
  if (cards.length === 0) {
    return (
      <section>
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">{title}</h2>
        <p className="text-sm text-[var(--text-muted)] pl-1">{emptyMsg}</p>
      </section>
    );
  }
  return (
    <section>
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">
        {title} <span className="text-[var(--text-muted)] font-normal text-sm ml-1">({cards.length})</span>
      </h2>
      <div className="space-y-1.5">
        {cards.map((card) => (
          <FocusCardRow key={card.id} card={card} onClick={() => onCardClick(card)} onDelete={() => onDelete(card.id)} isFading={fadingOut.has(card.id)} />
        ))}
      </div>
    </section>
  );
}

/* Category lane with drag-drop (cross-lane category change + within-lane reorder) */
function CategoryLane({ laneKey, title, color, cards, onCardClick, onDelete, fadingOut, isDragOver, onDragOver, onDragLeave, onDrop, onDragStartCard, dragCardId, dragSourceLane, onReorderDrop }: {
  laneKey: string; title: string; color: string; cards: Card[];
  onCardClick: (c: Card) => void; onDelete: (id: string) => void; fadingOut: Set<string>;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void; onDragLeave: () => void; onDrop: () => void;
  onDragStartCard: (id: string) => void;
  dragCardId: string | null;
  dragSourceLane: string | null;
  onReorderDrop: (beforeCardId: string | null) => void;
}) {
  const [innerDragOverId, setInnerDragOverId] = useState<string | null>(null);
  const isReorder = dragSourceLane === laneKey;
  return (
    <section
      onDragOver={(e) => { e.preventDefault(); if (!isReorder) onDragOver(e); }}
      onDragLeave={(e) => {
        const related = e.relatedTarget as Node | null;
        if (!e.currentTarget.contains(related)) {
          if (!isReorder) onDragLeave();
          else setInnerDragOverId(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (isReorder) { onReorderDrop(innerDragOverId); }
        else { onDrop(); }
        setInnerDragOverId(null);
      }}
      className={cn("rounded-lg transition-colors", !isReorder && isDragOver && "ring-2 ring-offset-2 ring-offset-[#13181f]")}
      style={!isReorder && isDragOver ? { outlineColor: color, ["--tw-ring-color" as string]: color } : undefined}
    >
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
        {title} <span className="text-[var(--text-muted)] font-normal text-sm">({cards.length})</span>
      </h2>
      {cards.length === 0 ? (
        <div className={cn("border-2 border-dashed rounded-lg p-4 text-center text-sm text-[var(--text-muted)] transition-colors",
          !isReorder && isDragOver ? "border-opacity-60" : "border-[var(--border)]"
        )} style={!isReorder && isDragOver ? { borderColor: color } : undefined}>
          Drop cards here
        </div>
      ) : (
        <div className="space-y-1.5">
          {cards.map((card) => (
            <div key={card.id}>
              {isReorder && innerDragOverId === card.id && (
                <div className="h-0.5 rounded-full mb-1 opacity-80" style={{ backgroundColor: color }} />
              )}
              <div
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStartCard(card.id); }}
                onDragEnter={() => { if (isReorder && card.id !== dragCardId) setInnerDragOverId(card.id); }}
              >
                <CategoryCardRow card={card} onClick={() => onCardClick(card)} onDelete={() => onDelete(card.id)} isFading={fadingOut.has(card.id)} />
              </div>
            </div>
          ))}
          {isReorder && innerDragOverId === null && dragCardId !== null && (
            <div className="h-0.5 rounded-full mt-1 opacity-80" style={{ backgroundColor: color }} />
          )}
        </div>
      )}
    </section>
  );
}

/* Card row for category view */
function CategoryCardRow({ card, onClick, onDelete, isFading }: {
  card: Card; onClick: () => void; onDelete: () => void; isFading: boolean;
}) {
  const a = assigneeConfig[card.assignee];
  const catColor = card.category ? CATEGORY_COLORS[card.category] : undefined;

  return (
    <div className={cn(
      "group flex items-center gap-3 w-full p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[#00bcd4]/40 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4)] cursor-grab",
      isFading && "opacity-0 scale-95 transition-all duration-300"
    )}>
      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: catColor || "#a0aab8" }} />
      <button onClick={onClick} className="flex-1 text-sm text-[var(--text-primary)] truncate text-left hover:text-[#00bcd4] transition-colors">
        {card.title}
      </button>
      <span className="text-xs text-[var(--text-muted)] flex-shrink-0 w-28 text-right truncate">{boardNames[card.board_id] || card.board_id}</span>
      <span className="text-xs text-[var(--text-muted)] flex-shrink-0 w-20 text-right">
        {card.due_date || "No date"}
      </span>
      <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-[#0d1117] flex-shrink-0", a.color)}>
        {a.initials}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex-shrink-0 h-5 w-5 rounded flex items-center justify-center text-[var(--text-muted)]/0 group-hover:text-[#f85149]/70 hover:!text-[#f85149] hover:bg-[#f85149]/10 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* Card row for time-sensitive view */
function FocusCardRow({ card, onClick, onDelete, isFading }: {
  card: Card; onClick: () => void; onDelete: () => void; isFading: boolean;
}) {
  const rag = getRagStatus(card);
  const p = priorityConfig[card.priority];
  const a = assigneeConfig[card.assignee];

  return (
    <div className={cn(
      "group flex items-center gap-3 w-full p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[#00bcd4]/40 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4)]",
      isFading && "opacity-0 scale-95 transition-all duration-300"
    )}>
      <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", ragDotColor[rag])} />
      <button onClick={onClick} className="flex-1 text-sm text-[var(--text-primary)] truncate text-left hover:text-[#00bcd4] transition-colors">
        {card.title}
      </button>
      <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border flex-shrink-0", p.class)}>
        {p.label}
      </span>
      <span className="text-xs text-[var(--text-muted)] flex-shrink-0 w-28 text-right truncate">{boardNames[card.board_id] || card.board_id}</span>
      <span className="text-xs text-[var(--text-muted)] flex-shrink-0 w-20 text-right">
        {card.due_date || "No date"}
      </span>
      <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-[#0d1117] flex-shrink-0", a.color)}>
        {a.initials}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex-shrink-0 h-5 w-5 rounded flex items-center justify-center text-[var(--text-muted)]/0 group-hover:text-[#f85149]/70 hover:!text-[#f85149] hover:bg-[#f85149]/10 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
