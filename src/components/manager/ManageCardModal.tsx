import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Trash2, Plus, CheckSquare, Square, X, CalendarIcon, Loader2, ArrowLeft, GripVertical, Pause, Play, Square as StopIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCardTimer } from "@/lib/manager/CardTimerContext";
import { updateCard, deleteCard, fetchChecklists, addChecklistItem, toggleChecklistItem, deleteChecklistItem, reorderChecklist, fetchBoard } from "@/lib/manager/managerApi";
import type { Card, Column, ChecklistItem } from "@/lib/manager/types";
import { CATEGORY_COLORS } from "@/lib/manager/types";
import { Calendar } from "@/components/ui/calendar";
import CardAttachments from "./CardAttachments";
import CardLinks from "./CardLinks";
import CardRelations from "./CardRelations";
import CardLabels from "./CardLabels";
import { toast } from "@/hooks/use-toast";

interface ManageCardModalProps {
  card: Card;
  columns: Column[];
  boardId: string;
  boardName?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ManageCardModal({ card: initialCard, columns: initialColumns, boardId, boardName = "", onClose, onSaved }: ManageCardModalProps) {
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
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [datePickHint, setDatePickHint] = useState<"start" | "end">("start");
  const dateRangeRef = useRef<HTMLDivElement>(null);
  const [columnId, setColumnId] = useState(card.column_id);
  const [warningHours, setWarningHours] = useState(card.warning_hours ?? 48);
  const [cardColor, setCardColor] = useState<string | null>(card.color ?? null);
  const [category, setCategory] = useState<Card["category"]>(card.category ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dateRangeOpen) return;
    const handler = (e: MouseEvent) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(e.target as Node)) {
        setDateRangeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dateRangeOpen]);

  const handleRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) { setStartDate(undefined); setDueDate(undefined); setDatePickHint("start"); return; }
    setStartDate(range.from);
    setDueDate(range.to);
    if (range.from && !range.to) {
      setDatePickHint("end");
    } else if (range.from && range.to) {
      setDateRangeOpen(false);
      setDatePickHint("start");
    }
  };

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
    setCategory(card.category ?? null);
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
        category,
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
    logCardActivity("checklist");
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
  const selectClass = "w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[#00bcd4] focus:outline-none appearance-none";
  const inputClass = "w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#00bcd4] focus:outline-none";

  // ── Card timer ───────────────────────────────────────────────────────────
  const { activeCardTimer, startTimer, pauseTimer, resumeTimer, stopTimer } = useCardTimer();
  const isThisCard = activeCardTimer?.cardId === card.id;

  useEffect(() => {
    startTimer({ id: card.id, title: card.title }, currentBoardId, boardName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  const fmtElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // ── Card activity logging ────────────────────────────────────────────────
  const logCardActivity = useCallback((eventType: string) => {
    fetch("/api/manage/card-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: card.id,
        card_title: card.title,
        board_id: currentBoardId,
        board_name: boardName,
        event_type: eventType,
      }),
    }).catch(() => {});
  }, [card.id, card.title, currentBoardId, boardName]);

  // Fire 'opened' once per card
  useEffect(() => {
    logCardActivity("opened");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  // Track description for 'edited' event
  const descriptionOnFocus = useRef(description);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header with inline title */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-elevated)] z-10">
          {cardStack.length > 0 && (
            <button onClick={() => setCardStack((prev) => prev.slice(0, -1))} className="text-[var(--text-muted)] hover:text-[#00bcd4] transition-colors flex-shrink-0" title="Back">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-lg font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none border-none"
            placeholder="Card title..."
          />
          {/* Timer clock */}
          {activeCardTimer && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={cn(
                "font-mono text-base font-semibold tabular-nums",
                isThisCard && !activeCardTimer.isPaused ? "text-[#4caf50]" : "text-[#d29922]"
              )}>
                {isThisCard && !activeCardTimer.isPaused ? "●" : "‖"}{" "}
                {isThisCard ? fmtElapsed(activeCardTimer.elapsedSeconds) : ""}
              </span>
              {isThisCard ? (
                activeCardTimer.isPaused ? (
                  <button onClick={resumeTimer} className="flex items-center justify-center w-7 h-7 p-1.5 rounded text-[#d29922] hover:text-[#ffd54f] hover:bg-[var(--bg-card)] transition-colors" title="Resume">
                    <Play className="h-4 w-4" />
                  </button>
                ) : (
                  <button onClick={pauseTimer} className="flex items-center justify-center w-7 h-7 p-1.5 rounded text-[#4caf50] hover:text-[#81c784] hover:bg-[var(--bg-card)] transition-colors" title="Pause">
                    <Pause className="h-4 w-4" />
                  </button>
                )
              ) : null}
              <button onClick={stopTimer} className="flex items-center justify-center w-7 h-7 p-1.5 rounded text-[var(--text-muted)] hover:text-[#f85149] hover:bg-[var(--bg-card)] transition-colors" title="Stop timer">
                <StopIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-5">

          <div>
            <label className="text-xs font-mono text-[var(--text-muted)] mb-1.5 block uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onFocus={() => { descriptionOnFocus.current = description; }}
              onBlur={() => {
                if (description !== descriptionOnFocus.current) {
                  logCardActivity("edited");
                }
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
          <div className="bg-[var(--bg-sidebar)] rounded-lg p-2.5 border border-[var(--border)] space-y-2">
            <div className="grid grid-cols-4 gap-x-2">
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] mb-0.5 block uppercase tracking-wider">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as Card["priority"])} className={cn(selectClass, "py-1 px-1.5 text-xs")}>
                  <option value="critical">🔴 Priority</option>
                  <option value="this_week">🔵 This Week</option>
                  <option value="backlog">⚪ Backlog</option>
                </select>
              </div>
              {/* Shared date range picker — col-span-2 so Start + Due stay side-by-side */}
              <div className="col-span-2 relative" ref={dateRangeRef}>
                <div className="grid grid-cols-2 gap-x-2">
                  {/* Start Date field */}
                  <div>
                    <label className="text-[10px] font-mono text-[var(--text-muted)] mb-0.5 block uppercase tracking-wider">Start Date</label>
                    <button
                      onClick={() => { setDatePickHint("start"); setDateRangeOpen(true); }}
                      className={cn(selectClass, "py-1 px-1.5 text-xs text-left flex items-center justify-between w-full", !startDate && "text-[var(--text-muted)]")}>
                      {startDate ? format(startDate, "MMM d") : "None"}
                      <CalendarIcon className="h-3 w-3 text-[var(--text-muted)]" />
                    </button>
                    {startDate && (
                      <button onClick={() => { setStartDate(undefined); setDueDate(undefined); }} className="text-[9px] text-[var(--text-muted)] hover:text-[#f85149] mt-0.5">Clear</button>
                    )}
                  </div>
                  {/* Due Date field */}
                  <div>
                    <label className="text-[10px] font-mono text-[var(--text-muted)] mb-0.5 block uppercase tracking-wider">Due Date</label>
                    <button
                      onClick={() => { setDatePickHint(startDate ? "end" : "start"); setDateRangeOpen(true); }}
                      className={cn(selectClass, "py-1 px-1.5 text-xs text-left flex items-center justify-between w-full", !dueDate && "text-[var(--text-muted)]")}>
                      {dueDate ? format(dueDate, "MMM d") : "None"}
                      <CalendarIcon className="h-3 w-3 text-[var(--text-muted)]" />
                    </button>
                    {dueDate && (
                      <button onClick={() => setDueDate(undefined)} className="text-[9px] text-[var(--text-muted)] hover:text-[#f85149] mt-0.5">Clear</button>
                    )}
                  </div>
                </div>
                {/* Shared calendar popover */}
                {dateRangeOpen && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-2xl">
                    <div className="px-3 pt-2.5 pb-0 text-[10px] font-mono text-[#00bcd4] uppercase tracking-widest">
                      {datePickHint === "start" ? "Select start date" : "Select end date"}
                    </div>
                    <Calendar
                      mode="range"
                      selected={{ from: startDate, to: dueDate }}
                      onSelect={handleRangeSelect}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      classNames={{
                        day_selected: "bg-[#00bcd4] text-white hover:bg-[#00bcd4] hover:text-white focus:bg-[#00bcd4] focus:text-white rounded-full",
                        day_range_end: "bg-[#00bcd4] text-white hover:bg-[#00bcd4] hover:text-white focus:bg-[#00bcd4] focus:text-white day-range-end rounded-full",
                        day_range_middle: "aria-selected:bg-[#00bcd4]/15 aria-selected:text-[var(--text-primary)] rounded-none",
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] mb-0.5 block uppercase tracking-wider">Warn Me</label>
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
                <label className="text-[10px] font-mono text-[var(--text-muted)] mb-0.5 block uppercase tracking-wider">Assignee</label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value as Card["assignee"])} className={cn(selectClass, "py-1 px-1.5 text-xs")}>
                  <option value="jeff">Jeff</option>
                  <option value="wife">Aneta</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] mb-0.5 block uppercase tracking-wider">Status</label>
                <select value={columnId} onChange={(e) => setColumnId(e.target.value)} className={cn(selectClass, "py-1 px-1.5 text-xs")}>
                  {columnsForCard.map((col) => (<option key={col.id} value={col.id}>{col.name}</option>))}
                </select>
              </div>
            </div>

            {/* Bar Colour picker */}
            <div className="pt-1">
              <label className="text-[10px] font-mono text-[var(--text-muted)] mb-1 block uppercase tracking-wider">Bar Colour</label>
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

            {/* Category selector */}
            <div className="pt-1">
              <label className="text-[10px] font-mono text-[var(--text-muted)] mb-1 block uppercase tracking-wider">Category</label>
              <div className="flex gap-1.5">
                {(["A", "B", "C", "D"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(category === cat ? null : cat)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold transition-all border",
                      category === cat
                        ? "text-white border-transparent"
                        : "bg-transparent hover:opacity-80"
                    )}
                    style={{
                      backgroundColor: category === cat ? CATEGORY_COLORS[cat] : "transparent",
                      borderColor: category !== cat ? CATEGORY_COLORS[cat] : "transparent",
                      color: category !== cat ? CATEGORY_COLORS[cat] : undefined,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <CardLabels cardId={card.id} boardId={currentBoardId} />

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" /> Checklist
                {checklist.length > 0 && <span className="text-[var(--text-primary)]">({doneCount}/{checklist.length})</span>}
              </label>
            </div>
            {checklist.length > 0 && (
              <div className="h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden mb-3">
                <div className={cn("h-full rounded-full transition-all", doneCount === checklist.length ? "bg-[#3fb950]" : "bg-[#00bcd4]")} style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
              </div>
            )}
            {loadingChecklist ? (
              <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm py-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...</div>
            ) : (
              <div className="space-y-1">
                {checklist.map((item, idx) => (
                  <div key={item.id} draggable
                    onDragStart={() => { dragItem.current = idx; }}
                    onDragOver={(e) => { e.preventDefault(); dragOverItem.current = idx; }}
                    onDragEnd={handleDragEnd}
                    className="flex items-center gap-1 w-full px-1 py-1 rounded hover:bg-[var(--bg-primary)] transition-colors group"
                  >
                    <GripVertical className="h-3.5 w-3.5 text-[#30363d] group-hover:text-[var(--text-muted)] cursor-grab flex-shrink-0" />
                    <button onClick={() => handleToggleChecklist(item)} className="flex items-center gap-2 flex-1 text-left">
                      {item.done ? <CheckSquare className="h-4 w-4 text-[#3fb950] flex-shrink-0" /> : <Square className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />}
                      <span className={cn("text-sm", item.done ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]")}>{item.text}</span>
                    </button>
                    <button onClick={() => handleDeleteChecklist(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[#f85149] p-1 transition-opacity flex-shrink-0" title="Delete item">
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
        <div className="flex items-center justify-between p-5 border-t border-[var(--border)] sticky bottom-0 bg-[var(--bg-elevated)]">
          <button onClick={handleDelete} className="text-sm text-[#f85149] hover:text-[#f85149]/80 flex items-center gap-1.5 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-md text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-semibold hover:bg-[#00bcd4]/90 disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
