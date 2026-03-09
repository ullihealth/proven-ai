import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchBoards, fetchBoard, updateCard } from "@/lib/manager/managerApi";
import type { Card, Board, Column } from "@/lib/manager/types";
import GanttChart from "@/components/manager/GanttChart";
import ManageCardModal from "@/components/manager/ManageCardModal";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type AssigneeFilter = "all" | "jeff" | "wife";

const selectClass = "bg-[#161b22] border border-[#30363d] text-[#e0e7ef] text-xs rounded-lg px-3 py-1.5 outline-none focus:border-[#00bcd4] transition-colors";

export default function TimelinePage() {
  const navigate = useNavigate();
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [allColumns, setAllColumns] = useState<Column[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>("all");
  const [boardFilter, setBoardFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { boards: boardList } = await fetchBoards();
      setBoards(boardList);
      const results = await Promise.all(boardList.map(b => fetchBoard(b.id)));
      const cards: Card[] = [];
      const cols: Column[] = [];
      results.forEach(r => { cards.push(...r.cards); cols.push(...r.columns); });
      setAllCards(cards);
      setAllColumns(cols);
    } catch (e) {
      setError((e as Error)?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Sync board metadata (colour etc.) when changed from the sidebar without re-fetching cards
  const { data: boardsQueryData } = useQuery({ queryKey: ["boards"], queryFn: fetchBoards, staleTime: 0 });
  useEffect(() => {
    if (boardsQueryData?.boards && boardsQueryData.boards.length > 0) {
      setBoards(boardsQueryData.boards);
    }
  }, [boardsQueryData]);

  const boardColorMap = Object.fromEntries(boards.map(b => [b.id, b.color || "#00bcd4"]));

  const filteredCards = allCards.filter(c => {
    if (assigneeFilter !== "all" && c.assignee !== assigneeFilter) return false;
    if (boardFilter !== "all" && c.board_id !== boardFilter) return false;
    return true;
  });
  const filteredBoards = boardFilter !== "all" ? boards.filter(b => b.id === boardFilter) : boards;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-[#a0aab8] text-sm font-mono">Loading timeline…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="rounded-lg border-2 border-[#f85149]/40 bg-[#f85149]/5 p-8 text-center max-w-md">
          <AlertTriangle className="h-8 w-8 text-[#f85149] mx-auto mb-3" />
          <p className="text-[#e0e7ef] font-semibold mb-1">Failed to load timeline</p>
          <p className="text-sm text-[#a0aab8] mb-4">{error}</p>
          <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#f85149]/20 text-[#f85149] text-sm font-semibold hover:bg-[#f85149]/30 transition-colors">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const editCardBoard = editCard ? boards.find(b => b.id === editCard.board_id) : null;
  const editCardColumns = editCardBoard ? allColumns.filter(c => c.board_id === editCardBoard.id) : [];

  return (
    <div className="h-screen flex flex-col">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#30363d] shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#e0e7ef]">All Boards Timeline</h1>
            <p className="text-xs sm:text-sm text-[#a0aab8] mt-0.5">
              {filteredCards.length} cards across {filteredBoards.length} {filteredBoards.length === 1 ? "board" : "boards"}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-0.5 bg-[#161b22] rounded-lg border border-[#30363d] p-0.5">
              <button onClick={() => navigate("/manage/focus")}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-[#a0aab8] hover:text-[#e0e7ef]">
                Time Sensitive
              </button>
              <button onClick={() => navigate("/manage/focus?view=category")}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-[#a0aab8] hover:text-[#e0e7ef]">
                Category View
              </button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-[#00bcd4] text-[#0d1117]">
                Timeline
              </button>
            </div>
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value as AssigneeFilter)} className={selectClass}>
              <option value="all">Assignees</option>
              <option value="jeff">Jeff</option>
              <option value="wife">Aneta</option>
            </select>
            <select value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)} className={selectClass}>
              <option value="all">All Boards</option>
              {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <GanttChart
          cards={filteredCards}
          boards={filteredBoards}
          columns={allColumns}
          groupBy="board"
          boardColorMap={boardColorMap}
          onCardClick={(card) => setEditCard(card)}
          onCardUpdate={async (id, updates) => {
            const prev = allCards.find(c => c.id === id);
            setAllCards(cs => cs.map(c => c.id === id ? { ...c, ...updates } : c));
            try {
              await updateCard(id, updates);
            } catch {
              if (prev) setAllCards(cs => cs.map(c => c.id === id ? prev : c));
              toast({ title: "Save failed", description: "Card dates could not be saved", variant: "destructive" });
            }
          }}
        />
      </div>

      {editCard && (
        <ManageCardModal
          card={editCard}
          columns={editCardColumns}
          boardId={editCard.board_id}
          onClose={() => setEditCard(null)}
          onSaved={() => { setEditCard(null); load(); }}
        />
      )}
    </div>
  );
}
