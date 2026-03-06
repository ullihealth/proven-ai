import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fetchBoard, updateCard, createCard, deleteCard, type Card, type Column } from "@/lib/manager";
import { Plus, Loader2, MoreVertical, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  critical: "bg-[#f85149]/20 text-[#f85149] border-[#f85149]/40",
  this_week: "bg-[#00bcd4]/20 text-[#00bcd4] border-[#00bcd4]/40",
  backlog: "bg-[#8b949e]/20 text-[#8b949e] border-[#8b949e]/40",
};

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
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editCard, setEditCard] = useState<Card | null>(null);

  const load = useCallback(() => {
    if (!boardId) return;
    setLoading(true);
    fetchBoard(boardId)
      .then((d) => {
        setColumns(d.columns.sort((a, b) => a.sort_order - b.sort_order));
        setCards(d.cards);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
    try {
      await updateCard(cardId, { column_id: newColumnId });
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, column_id: newColumnId } : c)));
    } catch {}
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCard(cardId);
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      setEditCard(null);
    } catch {}
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
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((col) => {
            const colCards = cards.filter((c) => c.column_id === col.id).sort((a, b) => a.sort_order - b.sort_order);
            return (
              <div
                key={col.id}
                className="w-72 flex-shrink-0 bg-[#161b22] rounded-lg border border-[#30363d] flex flex-col"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
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
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("cardId", card.id)}
                      onClick={() => setEditCard(card)}
                      className="p-3 rounded-md bg-[#1c2128] border border-[#30363d] cursor-pointer hover:border-[#00bcd4]/50 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4)] group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm text-[#c9d1d9] leading-snug">{card.title}</span>
                        <GripVertical className="h-3.5 w-3.5 text-[#30363d] group-hover:text-[#8b949e] flex-shrink-0 mt-0.5" />
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border", priorityColors[card.priority])}>
                          {card.priority === "critical" ? "CRIT" : card.priority === "this_week" ? "WEEK" : "BKL"}
                        </span>
                        <span className="text-[10px] text-[#8b949e]">
                          {card.assignee === "jeff" ? "JT" : "W"}
                        </span>
                        {card.due_date && (
                          <span className="text-[10px] text-[#8b949e]">{card.due_date}</span>
                        )}
                        {card.card_type && (
                          <span className="text-[10px] text-[#8b949e] bg-[#161b22] px-1.5 rounded">{card.card_type}</span>
                        )}
                        {card.content_type && (
                          <span className="text-[10px] text-[#8b949e] bg-[#161b22] px-1.5 rounded">{card.content_type}</span>
                        )}
                      </div>
                    </div>
                  ))}
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
                        <button onClick={() => handleAddCard(col.id)} className="px-3 py-1 rounded bg-[#00bcd4] text-[#0d1117] text-xs font-semibold">Add</button>
                        <button onClick={() => setAddingTo(null)} className="px-3 py-1 rounded text-[#8b949e] text-xs hover:text-[#c9d1d9]">Cancel</button>
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
        <CardDetailModal
          card={editCard}
          columns={columns}
          onClose={() => { setEditCard(null); load(); }}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  );
}

function CardDetailModal({
  card,
  columns,
  onClose,
  onDelete,
}: {
  card: Card;
  columns: Column[];
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [priority, setPriority] = useState(card.priority);
  const [assignee, setAssignee] = useState(card.assignee);
  const [dueDate, setDueDate] = useState(card.due_date || "");
  const [columnId, setColumnId] = useState(card.column_id);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCard(card.id, { title, description, priority, assignee, due_date: dueDate || null, column_id: columnId });
      onClose();
    } catch {} finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#1c2128] rounded-lg border border-[#30363d] w-full max-w-lg mx-4 p-6 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-mono text-[#c9d1d9]">Edit Card</h2>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#c9d1d9]">✕</button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9] focus:border-[#00bcd4] focus:outline-none"
          placeholder="Title"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9] focus:border-[#00bcd4] focus:outline-none resize-none"
          placeholder="Description (optional)"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#8b949e] mb-1 block">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Card["priority"])} className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9]">
              <option value="critical">Critical</option>
              <option value="this_week">This Week</option>
              <option value="backlog">Backlog</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#8b949e] mb-1 block">Assignee</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value as Card["assignee"])} className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9]">
              <option value="jeff">Jeff</option>
              <option value="wife">Wife</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#8b949e] mb-1 block">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9]" />
          </div>
          <div>
            <label className="text-xs text-[#8b949e] mb-1 block">Status</label>
            <select value={columnId} onChange={(e) => setColumnId(e.target.value)} className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9]">
              {columns.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button onClick={() => onDelete(card.id)} className="text-sm text-[#f85149] hover:text-[#f85149]/80 flex items-center gap-1">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-md text-sm text-[#8b949e] hover:text-[#c9d1d9]">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-semibold hover:bg-[#00bcd4]/90 disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
