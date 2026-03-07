import { useEffect, useState, useCallback } from "react";
import { fetchAllCards, fetchBoard, deleteCard, type Card, type Column } from "@/lib/manager";
import { getRagStatus, ragDotColor } from "@/lib/manager/ragStatus";
import ManageCardModal from "@/components/manager/ManageCardModal";
import { SkeletonRow } from "@/components/manager/Skeletons";
import { cn } from "@/lib/utils";
import { RefreshCw, AlertTriangle, Trash2, Check, X } from "lucide-react";

const boardNames: Record<string, string> = {
  content: "Content Pipeline",
  platform: "ProvenAI Platform",
  funnel: "Funnel & Email",
  bizdev: "Business Dev",
  strategy: "Strategy & Horizon",
};

const priorityOrder: Record<string, number> = { critical: 0, this_week: 1, backlog: 2 };

const priorityConfig: Record<string, { label: string; class: string }> = {
  critical: { label: "Critical", class: "text-[#f85149] bg-[#f85149]/10 border-[#f85149]/30" },
  this_week: { label: "This Week", class: "text-[#00bcd4] bg-[#00bcd4]/10 border-[#00bcd4]/30" },
  backlog: { label: "Backlog", class: "text-[#a0aab8] bg-[#a0aab8]/10 border-[#a0aab8]/30" },
};

const assigneeConfig: Record<string, { initials: string; color: string }> = {
  jeff: { initials: "JT", color: "bg-[#00bcd4]" },
  wife: { initials: "W", color: "bg-[#e91e8c]" },
};

const doneColumns = ["content-published", "platform-live", "funnel-active", "funnel-archived", "bizdev-active", "strategy-decided", "strategy-archived"];

type AssigneeFilter = "all" | "jeff" | "wife";
type BoardFilter = "all" | string;

export default function FocusPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>("all");
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [columnsMap, setColumnsMap] = useState<Record<string, Column[]>>({});
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAllCards()
      .then((d) => setCards(d.cards))
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
      // Wait for fade animation then remove
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

  const { red, amber, green, unscheduled } = categorize(active);

  const selectClass = "px-3 py-1.5 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#e0e7ef] focus:border-[#00bcd4] focus:outline-none appearance-none";

  const boards = [...new Set(cards.map((c) => c.board_id))];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-[#e0e7ef]">Focus</h1>
          <p className="text-sm text-[#a0aab8] mt-1">All outstanding cards prioritised by urgency</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value as AssigneeFilter)} className={selectClass}>
            <option value="all">All Assignees</option>
            <option value="jeff">Jeff</option>
            <option value="wife">Wife</option>
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
            <p className="text-[#e0e7ef] font-semibold mb-1">Failed to load</p>
            <p className="text-sm text-[#a0aab8] mb-4">{error}</p>
            <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#f85149]/20 text-[#f85149] text-sm font-semibold hover:bg-[#f85149]/30 transition-colors">
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <Zone title="🔴 Red Zone — Overdue" cards={red} onCardClick={handleCardClick} onDelete={handleDelete} fadingOut={fadingOut} emptyMsg="No overdue cards" />
          <Zone title="🟡 Amber Zone — Due Soon" cards={amber} onCardClick={handleCardClick} onDelete={handleDelete} fadingOut={fadingOut} emptyMsg="Nothing due soon" />
          <Zone title="🟢 Green Zone — Upcoming" cards={green} onCardClick={handleCardClick} onDelete={handleDelete} fadingOut={fadingOut} emptyMsg="No upcoming deadlines" />
          <Zone title="⚪ Unscheduled" cards={unscheduled} onCardClick={handleCardClick} onDelete={handleDelete} fadingOut={fadingOut} emptyMsg="All cards have due dates" />
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

function Zone({ title, cards, onCardClick, onDelete, fadingOut, emptyMsg }: {
  title: string;
  cards: Card[];
  onCardClick: (c: Card) => void;
  onDelete: (id: string) => void;
  fadingOut: Set<string>;
  emptyMsg: string;
}) {
  if (cards.length === 0) {
    return (
      <section>
        <h2 className="text-base font-semibold font-mono text-[#e0e7ef] mb-2">{title}</h2>
        <p className="text-sm text-[#a0aab8] pl-1">{emptyMsg}</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-base font-semibold font-mono text-[#e0e7ef] mb-2">
        {title} <span className="text-[#a0aab8] font-normal text-sm ml-1">({cards.length})</span>
      </h2>
      <div className="space-y-1.5">
        {cards.map((card) => (
          <FocusCardRow
            key={card.id}
            card={card}
            onClick={() => onCardClick(card)}
            onDelete={() => onDelete(card.id)}
            isFading={fadingOut.has(card.id)}
          />
        ))}
      </div>
    </section>
  );
}

function FocusCardRow({ card, onClick, onDelete, isFading }: {
  card: Card;
  onClick: () => void;
  onDelete: () => void;
  isFading: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const rag = getRagStatus(card);
  const p = priorityConfig[card.priority];
  const a = assigneeConfig[card.assignee];

  return (
    <div
      className={cn(
        "group flex items-center gap-3 w-full p-3 rounded-lg bg-[#242b35] border border-[#30363d] hover:border-[#00bcd4]/40 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4)]",
        isFading && "opacity-0 scale-95 transition-all duration-300"
      )}
    >
      <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", ragDotColor[rag])} />
      <button onClick={onClick} className="flex-1 text-sm text-[#e0e7ef] truncate text-left hover:text-[#00bcd4] transition-colors">
        {card.title}
      </button>
      <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border flex-shrink-0", p.class)}>
        {p.label}
      </span>
      <span className="text-xs text-[#a0aab8] flex-shrink-0 w-28 text-right truncate">{boardNames[card.board_id] || card.board_id}</span>
      <span className="text-xs text-[#a0aab8] flex-shrink-0 w-20 text-right">
        {card.due_date || "No date"}
      </span>
      <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-[#0d1117] flex-shrink-0", a.color)}>
        {a.initials}
      </div>

      {/* Delete action area */}
      <div className="flex-shrink-0 w-16 flex items-center justify-end">
        {confirming ? (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#f85149] font-medium mr-0.5">Delete?</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-5 w-5 rounded flex items-center justify-center bg-[#f85149]/20 text-[#f85149] hover:bg-[#f85149]/40 transition-colors"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
              className="h-5 w-5 rounded flex items-center justify-center bg-[#30363d] text-[#a0aab8] hover:bg-[#3d444d] transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            className="h-5 w-5 rounded flex items-center justify-center text-[#a0aab8]/0 group-hover:text-[#f85149]/70 hover:!text-[#f85149] hover:bg-[#f85149]/10 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
