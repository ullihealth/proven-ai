import { useState, useEffect } from "react";
import { Plus, X, Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { fetchBoards, fetchBoard, createCard } from "@/lib/manager/managerApi";
import type { Board, Column, Card } from "@/lib/manager/types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function QuickAddFAB({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [boardId, setBoardId] = useState("");
  const [columnId, setColumnId] = useState("");
  const [priority, setPriority] = useState<Card["priority"]>("this_week");
  const [assignee, setAssignee] = useState<Card["assignee"]>("jeff");
  const [dueDate, setDueDate] = useState<Date | undefined>();

  // Load boards on mount
  useEffect(() => {
    fetchBoards().then((d) => {
      setBoards(d.boards);
      if (d.boards.length > 0 && !boardId) setBoardId(d.boards[0].id);
    }).catch(() => {});
  }, []);

  // Load columns when board changes
  useEffect(() => {
    if (!boardId) return;
    fetchBoard(boardId).then((d) => {
      const sorted = d.columns.sort((a, b) => a.sort_order - b.sort_order);
      setColumns(sorted);
      if (sorted.length > 0) setColumnId(sorted[0].id);
    }).catch(() => setColumns([]));
  }, [boardId]);

  const reset = () => {
    setTitle("");
    setPriority("this_week");
    setAssignee("jeff");
    setDueDate(undefined);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !boardId || !columnId) return;
    setSaving(true);
    try {
      await createCard({
        title: title.trim(),
        board_id: boardId,
        column_id: columnId,
        priority,
        assignee,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      });
      reset();
      setOpen(false);
      onCreated?.();
    } catch (err) {
      console.error("[QuickAdd] Error:", err);
    } finally {
      setSaving(false);
    }
  };

  const selectClass = "w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9] focus:border-[#00bcd4] focus:outline-none appearance-none";
  const inputClass = "w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9] placeholder-[#8b949e] focus:border-[#00bcd4] focus:outline-none";

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full flex items-center justify-center",
          "bg-[#00bcd4] text-[#0d1117] shadow-[0_4px_20px_rgba(0,188,212,0.4)]",
          "hover:shadow-[0_4px_30px_rgba(0,188,212,0.6)] hover:scale-105",
          "active:scale-95 transition-all duration-200"
        )}
        title="Quick add card"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="bg-[#1c2128] rounded-t-xl sm:rounded-xl border border-[#30363d] w-full max-w-md mx-0 sm:mx-4 shadow-xl animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]">
              <h3 className="text-base font-semibold font-mono text-[#c9d1d9]">Quick Add Card</h3>
              <button onClick={() => setOpen(false)} className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) handleSubmit(); }}
                placeholder="Card title..."
                className={inputClass}
                autoFocus
              />

              {/* Board + Column row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider mb-1 block">Board</label>
                  <select value={boardId} onChange={(e) => setBoardId(e.target.value)} className={selectClass}>
                    {boards.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider mb-1 block">Column</label>
                  <select value={columnId} onChange={(e) => setColumnId(e.target.value)} className={selectClass}>
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority + Assignee row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider mb-1 block">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as Card["priority"])} className={selectClass}>
                    <option value="critical">🔴 Critical</option>
                    <option value="this_week">🔵 This Week</option>
                    <option value="backlog">⚪ Backlog</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider mb-1 block">Assignee</label>
                  <select value={assignee} onChange={(e) => setAssignee(e.target.value as Card["assignee"])} className={selectClass}>
                    <option value="jeff">Jeff</option>
                    <option value="wife">Wife</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider mb-1 block">Due Date</label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(selectClass, "text-left flex items-center justify-between flex-1", !dueDate && "text-[#8b949e]")}>
                        {dueDate ? format(dueDate, "PPP") : "Optional"}
                        <CalendarIcon className="h-4 w-4 text-[#8b949e]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1c2128] border-[#30363d]" align="start">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  {dueDate && (
                    <button onClick={() => setDueDate(undefined)} className="text-xs text-[#8b949e] hover:text-[#f85149]">✕</button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#30363d]">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-md text-sm text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !title.trim()}
                className="px-5 py-2 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-semibold hover:bg-[#00bcd4]/90 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
