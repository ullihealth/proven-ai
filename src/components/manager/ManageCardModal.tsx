import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Trash2, Plus, CheckSquare, Square, X, CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateCard, deleteCard, fetchChecklists, addChecklistItem, toggleChecklistItem } from "@/lib/manager/managerApi";
import type { Card, Column, ChecklistItem } from "@/lib/manager/types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CardAttachments from "./CardAttachments";
import CardLinks from "./CardLinks";
import CardRelations from "./CardRelations";

interface ManageCardModalProps {
  card: Card;
  columns: Column[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ManageCardModal({ card, columns, onClose, onSaved }: ManageCardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [priority, setPriority] = useState(card.priority);
  const [assignee, setAssignee] = useState(card.assignee);
  const [dueDate, setDueDate] = useState<Date | undefined>(card.due_date ? new Date(card.due_date) : undefined);
  const [columnId, setColumnId] = useState(card.column_id);
  const [saving, setSaving] = useState(false);

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [addingItem, setAddingItem] = useState(false);

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
        title,
        description,
        priority,
        assignee,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        column_id: columnId,
      });
      onSaved();
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this card?")) return;
    await deleteCard(card.id);
    onSaved();
  };

  const handleAddChecklist = async () => {
    if (!newItemText.trim()) return;
    setAddingItem(true);
    try {
      const { item } = await addChecklistItem(card.id, newItemText.trim());
      setChecklist((prev) => [...prev, item]);
      setNewItemText("");
    } catch {} finally {
      setAddingItem(false);
    }
  };

  const handleToggleChecklist = async (item: ChecklistItem) => {
    const newDone = !item.done;
    setChecklist((prev) => prev.map((c) => (c.id === item.id ? { ...c, done: newDone } : c)));
    try {
      await toggleChecklistItem(card.id, item.id, newDone);
    } catch {
      setChecklist((prev) => prev.map((c) => (c.id === item.id ? { ...c, done: item.done } : c)));
    }
  };

  const doneCount = checklist.filter((c) => c.done).length;

  const selectClass = "w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9] focus:border-[#00bcd4] focus:outline-none appearance-none";
  const inputClass = "w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9] placeholder-[#8b949e] focus:border-[#00bcd4] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#1c2128] rounded-lg border border-[#30363d] w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#30363d] sticky top-0 bg-[#1c2128] z-10">
          <h2 className="text-lg font-semibold font-mono text-[#c9d1d9]">Card Details</h2>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="text-xs font-mono text-[#8b949e] mb-1.5 block uppercase tracking-wider">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-mono text-[#8b949e] mb-1.5 block uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={cn(inputClass, "resize-none")}
              placeholder="Add a description..."
            />
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#8b949e] mb-1.5 block uppercase tracking-wider">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Card["priority"])} className={selectClass}>
                <option value="critical">🔴 Critical</option>
                <option value="this_week">🔵 This Week</option>
                <option value="backlog">⚪ Backlog</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-[#8b949e] mb-1.5 block uppercase tracking-wider">Assignee</label>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value as Card["assignee"])} className={selectClass}>
                <option value="jeff">Jeff</option>
                <option value="wife">Wife</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-[#8b949e] mb-1.5 block uppercase tracking-wider">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn(selectClass, "text-left flex items-center justify-between", !dueDate && "text-[#8b949e]")}>
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    <CalendarIcon className="h-4 w-4 text-[#8b949e]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1c2128] border-[#30363d]" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <button onClick={() => setDueDate(undefined)} className="text-[10px] text-[#8b949e] hover:text-[#f85149] mt-1">
                  Clear date
                </button>
              )}
            </div>
            <div>
              <label className="text-xs font-mono text-[#8b949e] mb-1.5 block uppercase tracking-wider">Status</label>
              <select value={columnId} onChange={(e) => setColumnId(e.target.value)} className={selectClass}>
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" />
                Checklist
                {checklist.length > 0 && (
                  <span className="text-[#c9d1d9]">({doneCount}/{checklist.length})</span>
                )}
              </label>
            </div>

            {/* Progress bar */}
            {checklist.length > 0 && (
              <div className="h-1.5 rounded-full bg-[#30363d] overflow-hidden mb-3">
                <div
                  className={cn("h-full rounded-full transition-all", doneCount === checklist.length ? "bg-[#3fb950]" : "bg-[#00bcd4]")}
                  style={{ width: `${(doneCount / checklist.length) * 100}%` }}
                />
              </div>
            )}

            {loadingChecklist ? (
              <div className="flex items-center gap-2 text-[#8b949e] text-sm py-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
              </div>
            ) : (
              <div className="space-y-1">
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleToggleChecklist(item)}
                    className="flex items-center gap-2.5 w-full text-left px-2 py-1.5 rounded hover:bg-[#0d1117] transition-colors group"
                  >
                    {item.done ? (
                      <CheckSquare className="h-4 w-4 text-[#3fb950] flex-shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-[#8b949e] flex-shrink-0" />
                    )}
                    <span className={cn("text-sm", item.done ? "text-[#8b949e] line-through" : "text-[#c9d1d9]")}>
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Add checklist item */}
            <div className="flex gap-2 mt-2">
              <input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddChecklist(); }}
                placeholder="Add item..."
                className={cn(inputClass, "flex-1")}
              />
              <button
                onClick={handleAddChecklist}
                disabled={addingItem || !newItemText.trim()}
                className="px-3 py-2 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-semibold hover:bg-[#00bcd4]/90 disabled:opacity-50 flex-shrink-0"
              >
                {addingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Attachments */}
          <CardAttachments cardId={card.id} />

          {/* Links */}
          <CardLinks cardId={card.id} />

          {/* Related Cards */}
          <CardRelations cardId={card.id} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[#30363d] sticky bottom-0 bg-[#1c2128]">
          <button onClick={handleDelete} className="text-sm text-[#f85149] hover:text-[#f85149]/80 flex items-center gap-1.5 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-md text-sm text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-semibold hover:bg-[#00bcd4]/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
