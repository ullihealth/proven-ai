import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fetchBoard, updateCard, createCard, fetchChecklists, fetchBoardLabels, fetchCardLabels } from "@/lib/manager/managerApi";
import type { Card, Column, ChecklistItem, ViewMode, Label } from "@/lib/manager/types";
import ManageCard from "@/components/manager/ManageCard";
import ManageCardModal from "@/components/manager/ManageCardModal";
import BoardListView from "@/components/manager/BoardListView";
import BoardCalendarView from "@/components/manager/BoardCalendarView";
import { Plus, Loader2, LayoutGrid, List, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";

const boardTitles: Record<string, string> = {
  content: "📝 Content Pipeline",
  platform: "🚀 ProvenAI Platform",
  funnel: "📧 Funnel & Email",
  bizdev: "🤝 Business Development",
  strategy: "🧠 Strategy & Horizon",
};

const viewIcons: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: "kanban", icon: LayoutGrid, label: "Kanban" },
  { mode: "list", icon: List, label: "List" },
  { mode: "calendar", icon: Calendar, label: "Calendar" },
];

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [cardLabelsMap, setCardLabelsMap] = useState<Record<string, Label[]>>({});
  const [filterLabelId, setFilterLabelId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(`board-view-${boardId}`) as ViewMode) || "kanban";
  });

  // Persist view preference
  useEffect(() => {
    if (boardId) localStorage.setItem(`board-view-${boardId}`, viewMode);
  }, [viewMode, boardId]);

  const load = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      const [d, labelsRes] = await Promise.all([
        fetchBoard(boardId),
        fetchBoardLabels(boardId),
      ]);
      const sortedCols = d.columns.sort((a, b) => a.sort_order - b.sort_order);
      setColumns(sortedCols);
      setCards(d.cards);
      setBoardLabels(labelsRes.labels);

      // Load checklists + card labels in parallel
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
    } catch {} finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => { load(); }, [load]);

  const handleAddCard = async (columnId: string) => {
    if (!newTitle.trim() || !boardId) return;
    try {
      await createCard({ board_id: boardId, column_id: columnId, title: newTitle.trim(), priority: "backlog", assignee: "jeff" });
      setNewTitle("");
      setAddingTo(null);
      load();
    } catch {}
  };

  const handleMoveCard = async (cardId: string, newColumnId: string) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, column_id: newColumnId } : c)));
    setDragOverCol(null);
    try {
      await updateCard(cardId, { column_id: newColumnId });
    } catch {
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00bcd4]" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col min-w-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#c9d1d9]">
            {boardTitles[boardId || ""] || boardId}
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">
            {cards.length} card{cards.length !== 1 ? "s" : ""} across {columns.length} columns
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-[#161b22] rounded-lg border border-[#30363d] p-1">
          {viewIcons.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              title={label}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === mode
                  ? "bg-[#00bcd4] text-[#0d1117]"
                  : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Label filter bar */}
      {boardLabels.length > 0 && (
        <div className="px-6 py-2 border-b border-[#30363d] flex items-center gap-2 flex-wrap shrink-0">
          <span className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider mr-1">Filter:</span>
          {boardLabels.map((l) => (
            <button
              key={l.id}
              onClick={() => setFilterLabelId(filterLabelId === l.id ? null : l.id)}
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all border",
                filterLabelId === l.id
                  ? "text-white border-white/30 shadow-[0_0_6px_rgba(255,255,255,0.15)]"
                  : "text-white/70 border-transparent hover:border-white/20"
              )}
              style={{ backgroundColor: filterLabelId === l.id ? l.color : `${l.color}99` }}
            >
              {l.name}
            </button>
          ))}
          {filterLabelId && (
            <button onClick={() => setFilterLabelId(null)} className="text-[10px] text-[#8b949e] hover:text-[#c9d1d9] flex items-center gap-0.5 ml-1">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Views */}
      {viewMode === "kanban" && (
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((col) => {
              const colCards = cards
                .filter((c) => c.column_id === col.id)
                .filter((c) => !filterLabelId || cardLabelsMap[c.id]?.some((l) => l.id === filterLabelId))
                .sort((a, b) => a.sort_order - b.sort_order);
              const isOver = dragOverCol === col.id;

              return (
                <div
                  key={col.id}
                  className={cn(
                    "w-72 flex-shrink-0 rounded-lg border flex flex-col transition-colors",
                    isOver
                      ? "bg-[#1c2128] border-[#00bcd4] shadow-[0_0_0_1px_#00bcd4]"
                      : "bg-[#161b22] border-[#30363d]"
                  )}
                  onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    const cardId = e.dataTransfer.getData("cardId");
                    if (cardId) handleMoveCard(cardId, col.id);
                  }}
                >
                  <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#c9d1d9]">{col.name}</span>
                    <span className="text-xs text-[#8b949e] bg-[#1c2128] px-2 py-0.5 rounded-full">{colCards.length}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {colCards.map((card) => (
                      <ManageCard
                        key={card.id}
                        card={card}
                        checklist={checklists[card.id]}
                        labels={cardLabelsMap[card.id]}
                        onClick={() => setEditCard(card)}
                        onDragStart={(e) => e.dataTransfer.setData("cardId", card.id)}
                      />
                    ))}
                    {colCards.length === 0 && !isOver && (
                      <div className="text-center py-8 text-[#8b949e] text-xs">Drop cards here</div>
                    )}
                  </div>

                  <div className="p-2 border-t border-[#30363d]">
                    {addingTo === col.id ? (
                      <div className="space-y-2">
                        <input
                          autoFocus
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddCard(col.id); if (e.key === "Escape") setAddingTo(null); }}
                          placeholder="Card title..."
                          className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9] placeholder-[#8b949e] focus:border-[#00bcd4] focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleAddCard(col.id)} className="px-3 py-1.5 rounded-md bg-[#00bcd4] text-[#0d1117] text-xs font-semibold">Add</button>
                          <button onClick={() => setAddingTo(null)} className="px-3 py-1.5 rounded-md text-[#8b949e] text-xs hover:text-[#c9d1d9]">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingTo(col.id); setNewTitle(""); }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128] transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add card
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div className="flex-1 overflow-y-auto">
          <BoardListView
            cards={filterLabelId ? cards.filter((c) => cardLabelsMap[c.id]?.some((l) => l.id === filterLabelId)) : cards}
            columns={columns}
            checklists={checklists}
            onCardClick={(card) => setEditCard(card)}
          />
        </div>
      )}

      {viewMode === "calendar" && (
        <div className="flex-1 overflow-y-auto">
          <BoardCalendarView
            cards={filterLabelId ? cards.filter((c) => cardLabelsMap[c.id]?.some((l) => l.id === filterLabelId)) : cards}
            columns={columns}
            onCardClick={(card) => setEditCard(card)}
          />
        </div>
      )}

      {/* Card detail modal */}
      {editCard && (
        <ManageCardModal
          card={editCard}
          columns={columns}
          boardId={boardId || ""}
          onClose={() => setEditCard(null)}
          onSaved={() => { setEditCard(null); load(); }}
        />
      )}
    </div>
  );
}
