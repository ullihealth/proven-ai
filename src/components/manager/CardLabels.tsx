import { useState, useEffect, useCallback } from "react";
import { Tag, Plus, X, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchBoardLabels,
  createLabel,
  updateLabel,
  deleteLabelApi,
  fetchCardLabels,
  assignCardLabel,
  removeCardLabel,
} from "@/lib/manager/managerApi";
import type { Label } from "@/lib/manager/types";

const PRESET_COLORS = [
  "#f85149", "#da3633", "#d29922", "#e3b341",
  "#3fb950", "#2ea043", "#00bcd4", "#1f6feb",
  "#6e40c9", "#8957e5", "#e91e8c", "#db61a2",
];

interface CardLabelsProps {
  cardId: string;
  boardId: string;
}

export default function CardLabels({ cardId, boardId }: CardLabelsProps) {
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [cardLabelIds, setCardLabelIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showManager, setShowManager] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bl, cl] = await Promise.all([
        fetchBoardLabels(boardId),
        fetchCardLabels(cardId),
      ]);
      setBoardLabels(bl.labels);
      setCardLabelIds(new Set(cl.labels.map((l) => l.id)));
    } catch {} finally {
      setLoading(false);
    }
  }, [boardId, cardId]);

  useEffect(() => { load(); }, [load]);

  const toggleLabel = async (labelId: string) => {
    const has = cardLabelIds.has(labelId);
    // Optimistic
    setCardLabelIds((prev) => {
      const next = new Set(prev);
      has ? next.delete(labelId) : next.add(labelId);
      return next;
    });
    try {
      has ? await removeCardLabel(cardId, labelId) : await assignCardLabel(cardId, labelId);
    } catch {
      load();
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const { label } = await createLabel(boardId, newName.trim(), newColor);
      setBoardLabels((prev) => [...prev, label]);
      setNewName("");
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingLabel) return;
    setSaving(true);
    try {
      await updateLabel(boardId, editingLabel.id, { name: editingLabel.name, color: editingLabel.color });
      setBoardLabels((prev) => prev.map((l) => (l.id === editingLabel.id ? editingLabel : l)));
      setEditingLabel(null);
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async (labelId: string) => {
    setBoardLabels((prev) => prev.filter((l) => l.id !== labelId));
    setCardLabelIds((prev) => { const next = new Set(prev); next.delete(labelId); return next; });
    try {
      await deleteLabelApi(boardId, labelId);
    } catch {
      load();
    }
  };

  const assignedLabels = boardLabels.filter((l) => cardLabelIds.has(l.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" />
          Labels
          {assignedLabels.length > 0 && <span className="text-[var(--text-primary)]">({assignedLabels.length})</span>}
        </label>
        <button
          onClick={() => setShowManager(!showManager)}
          className="text-[10px] text-[#00bcd4] hover:underline"
        >
          {showManager ? "Close" : "Manage"}
        </button>
      </div>

      {/* Assigned labels display */}
      {loading ? (
        <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm py-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {assignedLabels.map((l) => (
            <span
              key={l.id}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: l.color }}
            >
              {l.name}
              <button onClick={() => toggleLabel(l.id)} className="hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {assignedLabels.length === 0 && !showManager && (
            <span className="text-xs text-[var(--text-muted)]">No labels assigned</span>
          )}
        </div>
      )}

      {/* Label manager panel */}
      {showManager && (
        <div className="bg-[var(--bg-primary)] rounded-md border border-[var(--border)] p-3 space-y-3">
          {/* All board labels — click to toggle */}
          <div className="space-y-1">
            {boardLabels.map((l) => (
              <div key={l.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleLabel(l.id)}
                  className={cn(
                    "flex-1 flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors",
                    cardLabelIds.has(l.id) ? "bg-[var(--bg-card)]" : "hover:bg-[var(--bg-sidebar)]"
                  )}
                >
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="text-[var(--text-primary)]">{l.name}</span>
                  {cardLabelIds.has(l.id) && <span className="text-[10px] text-[#3fb950] ml-auto">✓</span>}
                </button>
                <button
                  onClick={() => setEditingLabel({ ...l })}
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDelete(l.id)}
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[#f85149] p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {boardLabels.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] py-1">No labels yet — create one below</p>
            )}
          </div>

          {/* Edit label inline */}
          {editingLabel && (
            <div className="border-t border-[var(--border)] pt-2 space-y-2">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Edit Label</p>
              <input
                value={editingLabel.name}
                onChange={(e) => setEditingLabel({ ...editingLabel, name: e.target.value })}
                className="w-full px-2 py-1.5 rounded bg-[var(--bg-sidebar)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[#00bcd4] focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditingLabel({ ...editingLabel, color: c })}
                    className={cn("h-5 w-5 rounded-full border-2 transition-all", editingLabel.color === c ? "border-white scale-110" : "border-transparent")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleUpdate} disabled={saving} className="px-3 py-1 rounded bg-[#00bcd4] text-[#0d1117] text-xs font-semibold">
                  {saving ? "..." : "Save"}
                </button>
                <button onClick={() => setEditingLabel(null)} className="text-xs text-[var(--text-muted)]">Cancel</button>
              </div>
            </div>
          )}

          {/* Create new label */}
          <div className="border-t border-[var(--border)] pt-2 space-y-2">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">New Label</p>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              placeholder="Label name..."
              className="w-full px-2 py-1.5 rounded bg-[var(--bg-sidebar)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#00bcd4] focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={cn("h-5 w-5 rounded-full border-2 transition-all", newColor === c ? "border-white scale-110" : "border-transparent")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#00bcd4] text-[#0d1117] text-xs font-semibold disabled:opacity-50"
            >
              <Plus className="h-3 w-3" /> Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
