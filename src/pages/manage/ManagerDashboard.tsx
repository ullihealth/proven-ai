import { useEffect, useState, useCallback } from "react";
import { fetchAllCards, fetchBoard, deleteCard, updateCard, fetchManagerSettings } from "@/lib/manager/managerApi";
import type { Card, Column } from "@/lib/manager/types";
import { getRagStatus, ragDotColor } from "@/lib/manager/ragStatus";
import ManageCardModal from "@/components/manager/ManageCardModal";
import CategoryView from "@/components/manager/CategoryView";
import { SkeletonStatCard, SkeletonRow } from "@/components/manager/Skeletons";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, Zap, CheckCircle2, RefreshCw, GanttChart as GanttChartIcon, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";

const boardNames: Record<string, string> = {
  content: "Content Pipeline",
  platform: "ProvenAI Platform",
  funnel: "Funnel & Email",
  bizdev: "Business Dev",
  strategy: "Strategy & Horizon",
};

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
const priorityOrder: Record<string, number> = { critical: 0, this_week: 1, backlog: 2 };

type ViewMode = "dashboard" | "category";
type AssigneeFilter = "all" | "jeff" | "wife";
type BoardFilter = "all" | string;

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("dashboard_view");
    return saved === "category" ? "category" : "dashboard";
  });
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>("all");
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [columnsMap, setColumnsMap] = useState<Record<string, Column[]>>({});
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set());
  const [catSettings, setCatSettings] = useState<Record<string, string>>({});

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

        const catADays = Number(settings.cat_a_days || 3);
        const catBDays = Number(settings.cat_b_days || 7);
        const catCDays = Number(settings.cat_c_days || 30);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        function getPlaceholderDates(category: string): { start_date: string; due_date: string } | undefined {
          if (category === "A") return { start_date: format(addDays(today, 1), "yyyy-MM-dd"), due_date: format(addDays(today, 2), "yyyy-MM-dd") };
          if (category === "B") return { start_date: format(addDays(today, catADays), "yyyy-MM-dd"), due_date: format(addDays(today, catADays + 1), "yyyy-MM-dd") };
          if (category === "C") return { start_date: format(addDays(today, catADays + catBDays), "yyyy-MM-dd"), due_date: format(addDays(today, catADays + catBDays + 1), "yyyy-MM-dd") };
          if (category === "D") return { start_date: format(addDays(today, catADays + catBDays + catCDays), "yyyy-MM-dd"), due_date: format(addDays(today, catADays + catBDays + catCDays + 1), "yyyy-MM-dd") };
        }

        const toBackfill = d.cards.filter((c: Card) => c.category && !c.start_date && !c.due_date);
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

  const changeView = (v: ViewMode) => {
    setViewMode(v);
    localStorage.setItem("dashboard_view", v);
  };

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

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const in3days = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10);

  const allActive = cards.filter((c) => !doneColumns.includes(c.column_id));
  const active = allActive
    .filter((c) => assigneeFilter === "all" || c.assignee === assigneeFilter)
    .filter((c) => boardFilter === "all" || c.board_id === boardFilter);

  const overdueStat = allActive.filter((c) => c.due_date && c.due_date < todayStr).length;
  const criticalStat = allActive.filter((c) => c.priority === "critical").length;
  const totalActive = allActive.length;
  const totalDone = cards.filter((c) => doneColumns.includes(c.column_id)).length;

  const overdueCards = active.filter((c) => c.due_date && c.due_date < todayStr);
  const criticalCards = active.filter((c) => c.priority === "critical");
  const comingUpCards = active.filter((c) => c.due_date && c.due_date >= todayStr && c.due_date <= in3days);
  const thisWeekCards = active.filter((c) => c.priority === "this_week");

  const categorize = (cards: Card[]) => {
    const red: Card[] = [], amber: Card[] = [], green: Card[] = [], unscheduled: Card[] = [];
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

  const { red, amber, green, unscheduled } = categorize(active);
  const boards = [...new Set(cards.map((c) => c.board_id))];
  const selectClass = "px-3 py-1.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[#00bcd4] focus:outline-none appearance-none";

  return (
    <div className="px-6 lg:px-10 py-4 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-sidebar)] rounded-lg border border-[var(--border)] p-0.5">
            <button
              onClick={() => changeView("dashboard")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                viewMode === "dashboard" ? "bg-[#00bcd4] text-[#0d1117]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >Dashboard</button>
            <button
              onClick={() => changeView("category")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                viewMode === "category" ? "bg-[#00bcd4] text-[#0d1117]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >Category View</button>
          </div>
          <button
            onClick={() => navigate("/manage/timeline")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[#00bcd4] transition-colors"
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
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        </>
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

      {/* Dashboard view */}
      {!loading && !error && viewMode === "dashboard" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={overdueStat > 0 ? <AlertTriangle className="h-5 w-5 text-[#f85149]" /> : null} label="Overdue" value={overdueStat} />
            <StatCard icon={<Zap className="h-5 w-5 text-[#f85149]" />} label="Priority" value={criticalStat} />
            <StatCard icon={<Clock className="h-5 w-5 text-[#00bcd4]" />} label="Active" value={totalActive} />
            <StatCard icon={<CheckCircle2 className="h-5 w-5 text-[#3fb950]" />} label="Done" value={totalDone} />
          </div>

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Today's Focus</h2>
            <div className="space-y-1.5">
              {[...overdueCards, ...criticalCards.filter((c) => !overdueCards.includes(c))].slice(0, 8).map((card) => (
                <DashCardRow key={card.id} card={card} onClick={() => handleCardClick(card)} onDelete={() => handleDelete(card.id)} isFading={fadingOut.has(card.id)} />
              ))}
              {overdueCards.length === 0 && criticalCards.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">Nothing urgent — nice work! 🎉</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Coming Up (3 days)</h2>
            <div className="space-y-1.5">
              {comingUpCards.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No upcoming deadlines</p>
              ) : (
                comingUpCards.map((card) => <DashCardRow key={card.id} card={card} onClick={() => handleCardClick(card)} onDelete={() => handleDelete(card.id)} isFading={fadingOut.has(card.id)} />)
              )}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">This Week Priority</h2>
            <div className="space-y-1.5">
              {thisWeekCards.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No this-week tasks</p>
              ) : (
                thisWeekCards.slice(0, 10).map((card) => <DashCardRow key={card.id} card={card} onClick={() => handleCardClick(card)} onDelete={() => handleDelete(card.id)} isFading={fadingOut.has(card.id)} />)
              )}
            </div>
          </section>
        </>
      )}

      {/* Category view */}
      {!loading && !error && viewMode === "category" && (
        <CategoryView
          cards={active}
          setCards={setCards}
          catSettings={catSettings}
          onCardClick={handleCardClick}
          onDelete={handleDelete}
          fadingOut={fadingOut}
          load={load}
        />
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

function StatCard({ icon, label, value }: { icon: React.ReactNode | null; label: string; value: number }) {
  return (
    <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-3">
        {icon ?? null}
        <div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">{value}</div>
          <div className="text-xs text-[var(--text-muted)]">{label}</div>
        </div>
      </div>
    </div>
  );
}

function DashCardRow({ card, onClick, onDelete, isFading }: {
  card: Card; onClick: () => void; onDelete: () => void; isFading: boolean;
}) {
  const rag = getRagStatus(card);
  const p = priorityConfig[card.priority] ?? priorityConfig.backlog;
  const a = assigneeConfig[card.assignee] ?? { initials: "?", color: "bg-[#a0aab8]" };

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
          <DashCardRow key={card.id} card={card} onClick={() => onCardClick(card)} onDelete={() => onDelete(card.id)} isFading={fadingOut.has(card.id)} />
        ))}
      </div>
    </section>
  );
}
