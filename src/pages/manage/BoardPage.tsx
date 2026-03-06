import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fetchBoard, updateCard, createCard, fetchChecklists } from "@/lib/manager/managerApi";
import type { Card, Column, ChecklistItem } from "@/lib/manager/types";
import ManageCard from "@/components/manager/ManageCard";
import ManageCardModal from "@/components/manager/ManageCardModal";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const boardTitles: Record<string, string> = {
  content: "📝 Content Pipeline",
  platform: "🚀 ProvenAI Platform",
  funnel: "📧 Funnel & Email",
  bizdev: "🤝 Business Development",
  strategy: "🧠 Strategy & Horizon",
};

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

  const load = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      const d = await fetchBoard(boardId);
      const sortedCols = d.columns.sort((a, b) => a.sort_order - b.sort_order);
      setColumns(sortedCols);
      setCards(d.cards);

      // Load checklists for all cards
      const checklistMap: Record<string, ChecklistItem[]> = {};
      await Promise.allSettled(
        d.cards.map(async (card) => {
          try {
            const { items } = await fetchChecklists(card.id);
            if (items.length > 0) checklistMap[card.id] = items;
          } catch {}
        })
      );
      setChecklists(checklistMap);
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
    // Optimistic update
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, column_id: newColumnId } : c)));
    setDragOverCol(null);
    try {
      await updateCard(cardId, { column_id: newColumnId });
    } catch {
      load(); // revert on failure
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#30363d]">
        <h1 className="text-xl font-bold font-mono text-[#c9d1d9]">
          {boardTitles[boardId || ""] || boardId}
        </h1>
        <p className="text-sm text-[#8b949e] mt-1">
          {cards.length} card{cards.length !== 1 ? "s" : ""} across {columns.length} columns
        </p>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((col) => {
            const colCards = cards.filter((c) => c.column_id === col.id).sort((a, b) => a.sort_order - b.sort_order);
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
                {/* Column header */}
                <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#c9d1d9]">{col.name}</span>
                  <span className="text-xs text-[#8b949e] bg-[#1c2128] px-2 py-0.5 rounded-full">{colCards.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colCards.map((card) => (
                    <ManageCard
                      key={card.id}
                      card={card}
                      checklist={checklists[card.id]}
                      onClick={() => setEditCard(card)}
                      onDragStart={(e) => e.dataTransfer.setData("cardId", card.id)}
                    />
                  ))}

                  {colCards.length === 0 && !isOver && (
                    <div className="text-center py-8 text-[#8b949e] text-xs">Drop cards here</div>
                  )}
                </div>

                {/* Add card */}
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

      {/* Card detail modal */}
      {editCard && (
        <ManageCardModal
          card={editCard}
          columns={columns}
          onClose={() => setEditCard(null)}
          onSaved={() => { setEditCard(null); load(); }}
        />
      )}
    </div>
  );
}
