import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fetchBoard, updateCard, createCard, fetchChecklists, fetchBoardLabels, fetchCardLabels } from "@/lib/manager/managerApi";
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
import { Plus, LayoutGrid, List, Calendar, X, AlertTriangle, RefreshCw, FolderOpen, GanttChart as GanttChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const stripEmoji = (s: string) => s.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();

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
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [cardLabelsMap, setCardLabelsMap] = useState<Record<string, Label[]>>({});
  const [filterLabelId, setFilterLabelId] = useState<string | null>(null);
  const [storageOpen, setStorageOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(`board-view-${boardId}`) as ViewMode) || "kanban";
  });

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

  /* Optimistic card creation */
  const handleAddCard = async (columnId: string) => {
    if (!newTitle.trim() || !boardId) return;
    const tempId = `temp-${Date.now()}`;
    const optimisticCard: Card = {
      id: tempId, board_id: boardId, column_id: columnId, title: newTitle.trim(),
      priority: "backlog", assignee: "jeff", description: null, due_date: null,
      content_type: null, card_type: null, platform: null, sort_order: 999,
      warning_hours: 48, start_date: null, color: null, category: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setCards((prev) => [...prev, optimisticCard]);
    setNewTitle("");
    setAddingTo(null);
    try {
      await createCard({ board_id: boardId, column_id: columnId, title: optimisticCard.title, priority: "backlog", assignee: "jeff" });
      load();
    } catch {
      setCards((prev) => prev.filter((c) => c.id !== tempId));
      toast({ title: "Failed to save", description: "Card could not be created", variant: "destructive" });
    }
  };

  /* Optimistic drag & drop */
  const handleMoveCard = async (cardId: string, newColumnId: string) => {
    const prevCards = [...cards];
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, column_id: newColumnId } : c)));
    setDragOverCol(null);
    try {
      await updateCard(cardId, { column_id: newColumnId });
    } catch {
      setCards(prevCards);
      toast({ title: "Failed to save", description: "Changes may not persist", variant: "destructive" });
    }
  };

  /* Loading state with skeletons */
  if (loading) {
    return (
      <div className="h-screen flex flex-col min-w-0">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#30363d] shrink-0">
          <div className="h-6 bg-[#30363d] rounded w-48 animate-pulse mb-2" />
          <div className="h-4 bg-[#30363d] rounded w-32 animate-pulse" />
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
          <p className="text-[#e0e7ef] font-semibold mb-1">Failed to load board</p>
          <p className="text-sm text-[#a0aab8] mb-4">{error}</p>
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
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#30363d] flex items-center justify-between shrink-0 min-w-0">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-[#e0e7ef] truncate">
            {board ? stripEmoji(board.name) : (boardTitles[boardId || ""] || boardId)}
          </h1>
          <p className="text-xs sm:text-sm text-[#a0aab8] mt-0.5 sm:mt-1">
            {cards.length} card{cards.length !== 1 ? "s" : ""} across {columns.length} columns
          </p>
        </div>

        {!isMobile && (
          <div className="flex items-center gap-1 bg-[#161b22] rounded-lg border border-[#30363d] p-1 shrink-0">
            {viewIcons.map(({ mode, icon: Icon, label }) => (
              <button key={mode} onClick={() => setViewMode(mode)} title={label}
                className={cn("p-2 rounded-md transition-colors", viewMode === mode ? "bg-[#00bcd4] text-[#0d1117]" : "text-[#a0aab8] hover:text-[#e0e7ef] hover:bg-[#242b35]")}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Label filter bar */}
      {boardLabels.length > 0 && (
        <div className="px-4 sm:px-6 py-2 border-b border-[#30363d] flex items-center gap-2 flex-wrap shrink-0">
          <span className="text-[10px] font-mono text-[#a0aab8] uppercase tracking-wider mr-1">Filter:</span>
          {boardLabels.map((l) => (
            <button key={l.id} onClick={() => setFilterLabelId(filterLabelId === l.id ? null : l.id)}
              className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all border",
                filterLabelId === l.id ? "text-white border-white/30 shadow-[0_0_6px_rgba(255,255,255,0.15)]" : "text-white/70 border-transparent hover:border-white/20"
              )} style={{ backgroundColor: filterLabelId === l.id ? l.color : `${l.color}99` }}
            >{l.name}</button>
          ))}
          {filterLabelId && (
            <button onClick={() => setFilterLabelId(null)} className="text-[10px] text-[#a0aab8] hover:text-[#e0e7ef] flex items-center gap-0.5 ml-1">
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
              const colCards = cards
                .filter((c) => c.column_id === col.id)
                .filter((c) => !filterLabelId || cardLabelsMap[c.id]?.some((l) => l.id === filterLabelId))
                .sort((a, b) => a.sort_order - b.sort_order);
              const isOver = dragOverCol === col.id;

              return (
                <div key={col.id}
                  className={cn("w-72 flex-shrink-0 rounded-lg border flex flex-col transition-colors",
                    isOver ? "bg-[#242b35] border-[#00bcd4] shadow-[0_0_0_1px_#00bcd4]" : "bg-[#161b22] border-[#30363d]"
                  )}
                  onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => { e.preventDefault(); const cardId = e.dataTransfer.getData("cardId"); if (cardId) handleMoveCard(cardId, col.id); }}
                >
                  <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#e0e7ef]">{stripEmoji(col.name)}</span>
                    <span className="text-xs text-[#a0aab8] bg-[#242b35] px-2 py-0.5 rounded-full">{colCards.length}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {colCards.map((card) => (
                      <ManageCard key={card.id} card={card} checklist={checklists[card.id]} labels={cardLabelsMap[card.id]}
                        onClick={() => setEditCard(card)} onDragStart={(e) => e.dataTransfer.setData("cardId", card.id)} />
                    ))}
                    {/* Empty column state */}
                    {colCards.length === 0 && !isOver && (
                      <button onClick={() => { setAddingTo(col.id); setNewTitle(""); }}
                        className="w-full py-8 rounded-lg border-2 border-dashed border-[#30363d] text-[#a0aab8] flex flex-col items-center gap-2 hover:border-[#00bcd4]/40 hover:text-[#e0e7ef] transition-colors">
                        <Plus className="h-5 w-5" />
                        <span className="text-xs">Add a card</span>
                      </button>
                    )}
                  </div>

                  <div className="p-2 border-t border-[#30363d]">
                    {addingTo === col.id ? (
                      <div className="space-y-2">
                        <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddCard(col.id); if (e.key === "Escape") setAddingTo(null); }}
                          placeholder="Card title..."
                          className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#e0e7ef] placeholder-[#a0aab8] focus:border-[#00bcd4] focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleAddCard(col.id)} className="px-3 py-1.5 rounded-md bg-[#00bcd4] text-[#0d1117] text-xs font-semibold">Add</button>
                          <button onClick={() => setAddingTo(null)} className="px-3 py-1.5 rounded-md text-[#a0aab8] text-xs hover:text-[#e0e7ef]">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingTo(col.id); setNewTitle(""); }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-[#a0aab8] hover:text-[#e0e7ef] hover:bg-[#242b35] transition-colors">
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
            <div className="h-20 w-20 rounded-full bg-[#242b35] border border-[#30363d] flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-[#a0aab8]" />
            </div>
            <p className="text-[#e0e7ef] font-semibold mb-1">No cards yet</p>
            <p className="text-sm text-[#a0aab8] mb-4">Add your first card to get started</p>
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
        <ManageCardModal card={editCard} columns={columns} boardId={boardId || ""}
          onClose={() => setEditCard(null)} onSaved={() => { setEditCard(null); load(); }} />
      )}

      {/* Floating Storage button */}
      {!isMobile && (
        <button onClick={() => setStorageOpen(true)}
          className="fixed bottom-6 left-6 z-30 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#242b35] border border-[#30363d] text-[#a0aab8] hover:text-[#00bcd4] hover:border-[#00bcd4]/40 shadow-lg transition-colors"
          title="Open Storage">
          <FolderOpen className="h-4 w-4" />
          <span className="text-xs font-mono">Storage</span>
        </button>
      )}
      <StorageOverlay open={storageOpen} onClose={() => setStorageOpen(false)} />
    </div>
  );
}
