import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Trash2, Plus, CheckSquare, Square, X, CalendarIcon, Loader2, ArrowLeft, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateCard, deleteCard, fetchChecklists, addChecklistItem, toggleChecklistItem, deleteChecklistItem, reorderChecklist, fetchBoard } from "@/lib/manager/managerApi";
import type { Card, Column, ChecklistItem } from "@/lib/manager/types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CardAttachments from "./CardAttachments";
import CardLinks from "./CardLinks";
import CardRelations from "./CardRelations";
import CardLabels from "./CardLabels";
import { toast } from "@/hooks/use-toast";

interface ManageCardModalProps {
  card: Card;
  columns: Column[];
  boardId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ManageCardModal({ card: initialCard, columns: initialColumns, boardId, onClose, onSaved }: ManageCardModalProps) {
  const [cardStack, setCardStack] = useState<{ card: Card; columns: Column[]; boardId: string }[]>([]);
  const currentEntry = cardStack.length > 0 ? cardStack[cardStack.length - 1] : { card: initialCard, columns: initialColumns, boardId };
  const card = currentEntry.card;
  const columnsForCard = currentEntry.columns.length > 0 ? currentEntry.columns : initialColumns;
  const currentBoardId = currentEntry.boardId;

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [priority, setPriority] = useState(card.priority);
  const [assignee, setAssignee] = useState(card.assignee);
  const [startDate, setStartDate] = useState<Date | undefined>(card.start_date ? new Date(card.start_date) : undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(card.due_date ? new Date(card.due_date) : undefined);
  const [columnId, setColumnId] = useState(card.column_id);
  const [warningHours, setWarningHours] = useState(card.warning_hours ?? 48);
  const [cardColor, setCardColor] = useState<string | null>(card.color ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description || "");
    setPriority(card.priority);
    setAssignee(card.assignee);
    setStartDate(card.start_date ? new Date(card.start_date) : undefined);
    setDueDate(card.due_date ? new Date(card.due_date) : undefined);
    setColumnId(card.column_id);
    setWarningHours(card.warning_hours ?? 48);
    setCardColor(card.color ?? null);
  }, [card]);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const loadChecklist = useCallback(() => {
    setLoadingChecklist(true);
    fetchChecklists(card.id)
      .then((d) => setChecklist(d.items.sort((a, b) => a.sort_order - b.sort_order)))
      .catch(() => setChecklist([]))
      .finally(() => setLoadingChecklist(false));
  }, [card.id]);

  useEffect(() => { loadChecklist(); }, [loadChecklist]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCard(card.id, {
        title, description, priority, assignee,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        column_id: columnId,
        warning_hours: warningHours,
        color: cardColor,
      });
      onSaved();
    } catch {
      toast({ title: "Failed to save", description: "Changes may not persist", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this card?")) return;
    try {
      await deleteCard(card.id);
      onSaved();
    } catch {
      toast({ title: "Failed to delete", description: "Card could not be deleted", variant: "destructive" });
    }
  };

  const handleAddChecklist = async () => {
    if (!newItemText.trim()) return;
    setAddingItem(true);
    try {
      const { item } = await addChecklistItem(card.id, newItemText.trim());
      setChecklist((prev) => [...prev, item]);
      setNewItemText("");
    } catch {} finally { setAddingItem(false); }
  };

  /* Optimistic checklist toggle */
  const handleToggleChecklist = async (item: ChecklistItem) => {
    const newDone = !item.done;
    setChecklist((prev) => prev.map((c) => (c.id === item.id ? { ...c, done: newDone } : c)));
    try { await toggleChecklistItem(card.id, item.id, newDone); }
    catch { setChecklist((prev) => prev.map((c) => (c.id === item.id ? { ...c, done: item.done } : c))); }
  };

  const handleDeleteChecklist = async (itemId: string) => {
    setChecklist((prev) => prev.filter((c) => c.id !== itemId));
    try { await deleteChecklistItem(card.id, itemId); }
    catch { loadChecklist(); }
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    const reordered = [...checklist];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, moved);
    setChecklist(reordered);
    dragItem.current = null;
    dragOverItem.current = null;
    try { await reorderChecklist(card.id, reordered.map((c) => c.id)); }
    catch { loadChecklist(); }
  };

  const doneCount = checklist.filter((c) => c.done).length;
  const selectClass = "w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#e0e7ef] focus:border-[#00bcd4] focus:outline-none appearance-none";
  const inputClass = "w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#e0e7ef] placeholder-[#a0aab8] focus:border-[#00bcd4] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#242b35] rounded-lg border border-[#30363d] w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header with inline title */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#30363d] sticky top-0 bg-[#242b35] z-10">
          {cardStack.length > 0 && (
            <button onClick={() => setCardStack((prev) => prev.slice(0, -1))} className="text-[#a0aab8] hover:text-[#00bcd4] transition-colors flex-shrink-0" title="Back">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-lg font-semibold text-[#e0e7ef] placeholder-[#a0aab8] focus:outline-none border-none"
            placeholder="Card title..."
          />
          <button onClick={onClose} className="text-[#a0aab8] hover:text-[#e0e7ef] transition-colors flex-shrink-0"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-5">

          <div>
            <label className="text-xs font-mono text-[#a0aab8] mb-1.5 block uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              ref={(el) => {
                if (el) {
                  el.style.height = "auto";
                  el.style.height = el.scrollHeight + "px";
                }
              }}
              rows={2}
              className={cn(inputClass, "resize-y min-h-[3.5rem]")}
              placeholder="Add a description..."
            />
          </div>

          {/* Compact metadata grid — Row 1: 4 cols, Row 2: 2 cols */}
          <div className="bg-[#161b22] rounded-lg p-2.5 border border-[#30363d] space-y-2">
            <div className="grid grid-cols-4 gap-x-2">
              <div>
                <label className="text-[10px] font-mono text-[#8b949e] mb-0.5 block uppercase tracking-wider">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as Card["priority"])} className={cn(selectClass, "py-1 px-1.5 text-xs")}>
                  <option value="critical">🔴 Critical</option>
                  <option value="this_week">🔵 This Week</option>
                  <option value="backlog">⚪ Backlog</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#8b949e] mb-0.5 block uppercase tracking-wider">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(selectClass, "py-1 px-1.5 text-xs text-left flex items-center justify-between", !startDate && "text-[#8b949e]")}>
                      {startDate ? format(startDate, "MMM d") : "None"}
                      <CalendarIcon className="h-3 w-3 text-[#8b949e]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#242b35] border-[#30363d]" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                {startDate && <button onClick={() => setStartDate(undefined)} className="text-[9px] text-[#8b949e] hover:text-[#f85149] mt-0.5">Clear</button>}
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#8b949e] mb-0.5 block uppercase tracking-wider">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(selectClass, "py-1 px-1.5 text-xs text-left flex items-center justify-between", !dueDate && "text-[#8b949e]")}>
                      {dueDate ? format(dueDate, "MMM d") : "None"}
                      <CalendarIcon className="h-3 w-3 text-[#8b949e]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#242b35] border-[#30363d]" align="start">
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                {dueDate && <button onClick={() => setDueDate(undefined)} className="text-[9px] text-[#8b949e] hover:text-[#f85149] mt-0.5">Clear</button>}
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#8b949e] mb-0.5 block uppercase tracking-wider">Warn Me</label>
                <select value={warningHours} onChange={(e) => setWarningHours(Number(e.target.value))} className={cn(selectClass, "py-1 px-1.5 text-xs")}>
                  <option value={24}>24h</option>
                  <option value={48}>48h</option>
                  <option value={72}>72h</option>
                  <option value={168}>1w</option>
                  <option value={336}>2w</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-x-2">
              <div>
                <label className="text-[10px] font-mono text-[#8b949e] mb-0.5 block uppercase tracking-wider">Assignee</label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value as Card["assignee"])} className={cn(selectClass, "py-1 px-1.5 text-xs")}>
                  <option value="jeff">Jeff</option>
                  <option value="wife">Wife</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#8b949e] mb-0.5 block uppercase tracking-wider">Status</label>
                <select value={columnId} onChange={(e) => setColumnId(e.target.value)} className={cn(selectClass, "py-1 px-1.5 text-xs")}>
                  {columnsForCard.map((col) => (<option key={col.id} value={col.id}>{col.name}</option>))}
                </select>
              </div>
            </div>

            {/* Bar Colour picker */}
            <div className="pt-1">
              <label className="text-[10px] font-mono text-[#8b949e] mb-1 block uppercase tracking-wider">Bar Colour</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Cyan", hex: "#00bcd4" },
                  { label: "Pink", hex: "#e91e8c" },
                  { label: "Green", hex: "#4caf50" },
                  { label: "Amber", hex: "#ff9800" },
                  { label: "Red", hex: "#f44336" },
                  { label: "Purple", hex: "#9c27b0" },
                  { label: "Blue", hex: "#2196f3" },
                  { label: "Teal", hex: "#009688" },
                  { label: "Orange", hex: "#ff5722" },
                  { label: "Grey", hex: "#607d8b" },
                ].map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    onClick={() => setCardColor(cardColor === c.hex ? null : c.hex)}
                    className={cn(
                      "w-5 h-5 rounded-full transition-all",
                      cardColor === c.hex ? "ring-2 ring-offset-1 ring-offset-[#161b22]" : "hover:scale-110"
                    )}
                    style={{
                      backgroundColor: c.hex,
                      ...(cardColor === c.hex ? { ringColor: c.hex } : {}),
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <CardLabels cardId={card.id} boardId={currentBoardId} />

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono text-[#a0aab8] uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" /> Checklist
                {checklist.length > 0 && <span className="text-[#e0e7ef]">({doneCount}/{checklist.length})</span>}
              </label>
            </div>
            {checklist.length > 0 && (
              <div className="h-1.5 rounded-full bg-[#30363d] overflow-hidden mb-3">
                <div className={cn("h-full rounded-full transition-all", doneCount === checklist.length ? "bg-[#3fb950]" : "bg-[#00bcd4]")} style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
              </div>
            )}
            {loadingChecklist ? (
              <div className="flex items-center gap-2 text-[#a0aab8] text-sm py-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...</div>
            ) : (
              <div className="space-y-1">
                {checklist.map((item, idx) => (
                  <div key={item.id} draggable
                    onDragStart={() => { dragItem.current = idx; }}
                    onDragOver={(e) => { e.preventDefault(); dragOverItem.current = idx; }}
                    onDragEnd={handleDragEnd}
                    className="flex items-center gap-1 w-full px-1 py-1 rounded hover:bg-[#0d1117] transition-colors group"
                  >
                    <GripVertical className="h-3.5 w-3.5 text-[#30363d] group-hover:text-[#a0aab8] cursor-grab flex-shrink-0" />
                    <button onClick={() => handleToggleChecklist(item)} className="flex items-center gap-2 flex-1 text-left">
                      {item.done ? <CheckSquare className="h-4 w-4 text-[#3fb950] flex-shrink-0" /> : <Square className="h-4 w-4 text-[#a0aab8] flex-shrink-0" />}
                      <span className={cn("text-sm", item.done ? "text-[#a0aab8] line-through" : "text-[#e0e7ef]")}>{item.text}</span>
                    </button>
                    <button onClick={() => handleDeleteChecklist(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#a0aab8] hover:text-[#f85149] p-1 transition-opacity flex-shrink-0" title="Delete item">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <input value={newItemText} onChange={(e) => setNewItemText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddChecklist(); }} placeholder="Add item..." className={cn(inputClass, "flex-1")} />
              <button onClick={handleAddChecklist} disabled={addingItem || !newItemText.trim()} className="px-3 py-2 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-semibold hover:bg-[#00bcd4]/90 disabled:opacity-50 flex-shrink-0">
                {addingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <CardAttachments cardId={card.id} />
          <CardLinks cardId={card.id} />
          <CardRelations cardId={card.id}
            onOpenRelated={async (relatedCard) => {
              try {
                const boardData = await fetchBoard(relatedCard.board_id);
                setCardStack((prev) => [...prev, { card: relatedCard, columns: boardData.columns, boardId: relatedCard.board_id }]);
              } catch {
                setCardStack((prev) => [...prev, { card: relatedCard, columns: [], boardId: relatedCard.board_id }]);
              }
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[#30363d] sticky bottom-0 bg-[#242b35]">
          <button onClick={handleDelete} className="text-sm text-[#f85149] hover:text-[#f85149]/80 flex items-center gap-1.5 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-md text-sm text-[#a0aab8] hover:text-[#e0e7ef] transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-semibold hover:bg-[#00bcd4]/90 disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
