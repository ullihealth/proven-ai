import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import type { Theme } from "@/lib/theme";
import { Key, Save, CheckCircle2, Pencil, Trash2, Plus, GripVertical, X } from "lucide-react";
import { fetchBoards, createBoard, updateBoard, deleteBoard, reorderBoards, fetchBoard, fetchManagerSettings, updateManagerSettings } from "@/lib/manager/managerApi";
import type { Board } from "@/lib/manager/types";
import { CATEGORY_COLORS } from "@/lib/manager/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#00bcd4", "#e91e8c", "#3fb950", "#d29922", "#f85149", "#8b5cf6",
  "#ec4899", "#f97316", "#06b6d4", "#14b8a6", "#6366f1", "#8b949e",
];

const EMOJI_PICKS = ["", "📝", "🚀", "📧", "🤝", "🧠", "📊", "💡", "🎯", "⚡", "🔧", "📦", "🏗️", "🎨", "📈", "🔍", "💬"];

// ─── Timer sound helpers ───────────────────────────────────────────────────────────────
type SoundOption = "bell" | "chime" | "ding" | "soft-alert" | "none";

const SOUND_OPTIONS: { value: SoundOption; label: string }[] = [
  { value: "bell",       label: "Bell" },
  { value: "chime",      label: "Chime" },
  { value: "ding",       label: "Ding" },
  { value: "soft-alert", label: "Soft Alert" },
  { value: "none",       label: "None" },
];

function playSound(type: SoundOption) {
  if (type === "none") return;
  try {
    const ac = new AudioContext();
    const t = ac.currentTime;
    const play = (freq: number, start: number, dur: number, shape: OscillatorType = "sine", vol = 0.3) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = shape;
      osc.frequency.setValueAtTime(freq, t + start);
      gain.gain.setValueAtTime(vol, t + start);
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t + start);
      osc.stop(t + start + dur);
    };
    if (type === "bell") {
      play(440, 0, 1.5, "sine", 0.35);
      play(880, 0, 1.2, "sine", 0.15);
      play(1320, 0, 0.8, "sine", 0.08);
    } else if (type === "chime") {
      play(880, 0, 0.8);
      play(1100, 0.3, 0.6);
    } else if (type === "ding") {
      play(1480, 0, 0.5, "triangle", 0.35);
      play(2960, 0, 0.25, "sine", 0.1);
    } else if (type === "soft-alert") {
      play(660, 0,   0.3, "sine", 0.2);
      play(660, 0.4, 0.3, "sine", 0.2);
      play(660, 0.8, 0.3, "sine", 0.2);
    }
  } catch {}
}

function SoundSelect({ label, value, onChange }: { label: string; value: SoundOption; onChange: (v: SoundOption) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--text-muted)] w-24 shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SoundOption)}
        className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#00bcd4]"
      >
        {SOUND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button
        type="button"
        onClick={() => playSound(value)}
        className="px-3 py-2 rounded-md border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[#8b949e] transition-colors"
      >
        Preview
      </button>
    </div>
  );
}

export default function ManagerSettings() {
  const queryClient = useQuery({ queryKey: ["boards"], queryFn: fetchBoards });
  const boards = queryClient.data?.boards ?? [];
  const { theme, setTheme } = useTheme();

  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ board: Board; cardCount: number } | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Sound settings
  const [loopSound, setLoopSound] = useState<SoundOption>("chime");
  const [breakSound, setBreakSound] = useState<SoundOption>("bell");

  // Category ranges
  const [catA, setCatA] = useState("7");
  const [catB, setCatB] = useState("30");
  const [catC, setCatC] = useState("90");
  const [catD, setCatD] = useState("180");
  const [catSaved, setCatSaved] = useState(false);
  const [catLoading, setCatLoading] = useState(true);

  useEffect(() => {
    setApiKey(localStorage.getItem("provenai_anthropic_key") || "");
    try {
      setLoopSound((localStorage.getItem("pomodoro_loop_sound") as SoundOption) || "chime");
      setBreakSound((localStorage.getItem("pomodoro_break_sound") as SoundOption) || "bell");
    } catch {}
    fetchManagerSettings()
      .then(({ settings }) => {
        setCatA(settings.cat_a_days || "7");
        setCatB(settings.cat_b_days || "30");
        setCatC(settings.cat_c_days || "90");
        setCatD(settings.cat_d_days || "180");
      })
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, []);

  const handleSave = () => {
    localStorage.setItem("provenai_anthropic_key", apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLoopSoundChange = (v: SoundOption) => {
    setLoopSound(v);
    try { localStorage.setItem("pomodoro_loop_sound", v); } catch {}
  };

  const handleBreakSoundChange = (v: SoundOption) => {
    setBreakSound(v);
    try { localStorage.setItem("pomodoro_break_sound", v); } catch {}
  };

  const handleSaveCategoryRanges = async () => {
    try {
      await updateManagerSettings({
        cat_a_days: catA,
        cat_b_days: catB,
        cat_c_days: catC,
        cat_d_days: catD,
      });
      setCatSaved(true);
      setTimeout(() => setCatSaved(false), 2000);
      toast.success("Category ranges saved.");
    } catch {
      toast.error("Failed to save category ranges.");
    }
  };

  const handleCreateBoard = async () => {
    if (!newName.trim()) return;
    try {
      await createBoard({ name: newName.trim(), icon: newIcon, color: newColor, sort_order: boards.length + 1 });
      queryClient.refetch();
      setShowNewBoard(false);
      setNewName(""); setNewIcon(""); setNewColor(PRESET_COLORS[0]);
      toast.success("Board created.");
    } catch { toast.error("Failed to create board."); }
  };

  const handleUpdateBoard = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await updateBoard(editingId, { name: editName.trim(), icon: editIcon, color: editColor });
      queryClient.refetch();
      setEditingId(null);
      toast.success("Board updated.");
    } catch { toast.error("Failed to update board."); }
  };

  const startEdit = (b: Board) => {
    setEditingId(b.id); setEditName(b.name); setEditIcon(b.icon); setEditColor(b.color || PRESET_COLORS[0]);
  };

  const handleDeleteClick = async (board: Board) => {
    try {
      const data = await fetchBoard(board.id);
      setDeleteConfirm({ board, cardCount: data.cards?.length ?? 0 });
    } catch { setDeleteConfirm({ board, cardCount: 0 }); }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteBoard(deleteConfirm.board.id);
      queryClient.refetch();
      setDeleteConfirm(null);
      toast.success("Board deleted.");
    } catch { toast.error("Failed to delete board."); }
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); return; }
    const reordered = [...boards];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setDragIdx(null);
    try {
      await reorderBoards(reordered.map(b => b.id));
      queryClient.refetch();
    } catch { toast.error("Failed to reorder boards."); }
  };

  const colorPicker = (selected: string, onChange: (c: string) => void) => (
    <div className="flex flex-wrap gap-1.5">
      {PRESET_COLORS.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className={cn("w-6 h-6 rounded-full border-2 transition-all", selected === c ? "border-white scale-110" : "border-transparent")}
          style={{ backgroundColor: c }} />
      ))}
    </div>
  );

  const emojiPicker = (selected: string, onChange: (e: string) => void) => (
    <div className="flex flex-wrap gap-1">
      {EMOJI_PICKS.map((e, i) => (
        <button key={i} type="button" onClick={() => onChange(e)}
          className={cn("w-8 h-8 rounded text-lg flex items-center justify-center transition-all", selected === e ? "bg-[var(--bg-hover)] ring-1 ring-[#00bcd4]" : "hover:bg-[var(--bg-hover)]")}
        >{e === "" ? <span className="w-4 h-4 rounded border border-dashed border-[#484f58]" /> : e}</button>
      ))}
    </div>
  );

  const catInputClass = "w-20 px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] text-center focus:border-[#00bcd4] focus:outline-none";

  const themes: { id: Theme; label: string; bg: string; card: string; sidebar: string; border: string }[] = [
    { id: "dark",  label: "Dark",  bg: "#0d1117", card: "#1c2128", sidebar: "#161b22", border: "#30363d" },
    { id: "mid",   label: "Mid",   bg: "#f5f0e8", card: "#ede8df", sidebar: "#e8e2d9", border: "#d4cec6" },
    { id: "light", label: "Light", bg: "#ffffff",  card: "#f6f8fa", sidebar: "#f0f2f5", border: "#d0d7de" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Configure your ProvenAI Manager</p>
      </div>

      {/* Appearance */}
      <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Appearance</h2>
        <p className="text-sm text-[var(--text-muted)]">Choose a display theme for the Manager.</p>
        <div className="flex gap-4">
          {themes.map(({ id, label, bg, card, sidebar, border }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border-2 p-2 transition-all",
                theme === id ? "border-[#00bcd4]" : "border-[var(--border)] hover:border-[#8b949e]"
              )}
            >
              {/* Swatch: sidebar strip + main bg + card bar */}
              <div
                className="w-20 h-12 rounded overflow-hidden flex"
                style={{ border: `1px solid ${border}` }}
              >
                <div className="w-4 h-full" style={{ backgroundColor: sidebar }} />
                <div className="flex-1 flex flex-col">
                  <div className="flex-1" style={{ backgroundColor: bg }} />
                  <div className="h-3" style={{ backgroundColor: card }} />
                </div>
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: theme === id ? "#00bcd4" : "#a0aab8" }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-[#e91e8c]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Anthropic API Key</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Required for the AI Assistant. Get your key from{" "}
          <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-[#00bcd4] hover:underline">console.anthropic.com</a>
        </p>
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-ant-api..."
          className="w-full px-4 py-3 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#00bcd4] focus:outline-none" />
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-semibold hover:bg-[#00bcd4]/90">
            <Save className="h-4 w-4" /> Save
          </button>
          {saved && <span className="text-sm text-[#3fb950] flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
        </div>
      </div>

      {/* Timer Sounds */}
      <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Timer Sounds</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Choose notification sounds for the Pomodoro timer. Click Preview to hear them.
        </p>
        <div className="space-y-3">
          <SoundSelect label="Loop sound" value={loopSound} onChange={handleLoopSoundChange} />
          <SoundSelect label="Break sound" value={breakSound} onChange={handleBreakSoundChange} />
        </div>
      </div>

      {/* Category Ranges */}
      <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Category Ranges</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Define the target completion window for each planning category. Used for Focus page lanes, Timeline zones, and placeholder dates on new cards.
        </p>
        {catLoading ? (
          <div className="text-sm text-[var(--text-muted)] animate-pulse">Loading...</div>
        ) : (
          <div className="space-y-3">
            {([
              { key: "A", value: catA, set: setCatA, color: CATEGORY_COLORS.A },
              { key: "B", value: catB, set: setCatB, color: CATEGORY_COLORS.B },
              { key: "C", value: catC, set: setCatC, color: CATEGORY_COLORS.C },
              { key: "D", value: catD, set: setCatD, color: CATEGORY_COLORS.D },
            ] as const).map(({ key, value, set, color }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-medium text-[var(--text-primary)] w-24">Cat {key}</span>
                <span className="text-sm text-[var(--text-muted)]">complete within</span>
                <input type="number" min="1" max="999" value={value} onChange={(e) => set(e.target.value)} className={catInputClass} />
                <span className="text-sm text-[var(--text-muted)]">days</span>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSaveCategoryRanges} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-semibold hover:bg-[#00bcd4]/90">
                <Save className="h-4 w-4" /> Save Ranges
              </button>
              {catSaved && <span className="text-sm text-[#3fb950] flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
            </div>
          </div>
        )}
      </div>

      {/* Board Management */}
      <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Boards</h2>
          <button onClick={() => setShowNewBoard(!showNewBoard)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[#8b949e] transition-colors">
            <Plus className="h-3.5 w-3.5" /> New Board
          </button>
        </div>

        {showNewBoard && (
          <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] space-y-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Board name"
              className="w-full px-3 py-2 rounded-md bg-[var(--bg-sidebar)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[#484f58] focus:border-[#00bcd4] focus:outline-none" />
            <div><label className="text-xs text-[var(--text-muted)] mb-1 block">Icon</label>{emojiPicker(newIcon, setNewIcon)}</div>
            <div><label className="text-xs text-[var(--text-muted)] mb-1 block">Colour</label>{colorPicker(newColor, setNewColor)}</div>
            <div className="flex gap-2">
              <button onClick={handleCreateBoard} disabled={!newName.trim()}
                className="px-4 py-1.5 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-medium hover:bg-[#00bcd4]/90 disabled:opacity-50">Create</button>
              <button onClick={() => setShowNewBoard(false)} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {boards.map((board, idx) => (
            <div key={board.id} draggable onDragStart={() => handleDragStart(idx)} onDragOver={handleDragOver} onDrop={() => handleDrop(idx)}
              className={cn("rounded-lg border transition-colors", dragIdx === idx ? "border-[#00bcd4] bg-[#00bcd4]/5" : "border-[var(--border)] bg-[var(--bg-sidebar)]")}>
              {editingId === board.id ? (
                <div className="p-4 space-y-3">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[#00bcd4] focus:outline-none" />
                  <div><label className="text-xs text-[var(--text-muted)] mb-1 block">Icon</label>{emojiPicker(editIcon, setEditIcon)}</div>
                  <div><label className="text-xs text-[var(--text-muted)] mb-1 block">Colour</label>{colorPicker(editColor, setEditColor)}</div>
                  <div className="flex gap-2">
                    <button onClick={handleUpdateBoard} className="px-3 py-1.5 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-medium">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-sm text-[var(--text-muted)]">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <GripVertical className="h-4 w-4 text-[#484f58] cursor-grab flex-shrink-0" />
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: board.color || "#00bcd4" }} />
                  {board.icon ? <span className="text-base mr-1">{board.icon}</span> : null}
                  <span className="text-sm font-medium text-[var(--text-primary)] flex-1">{board.name}</span>
                  <button onClick={() => startEdit(board)} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDeleteClick(board)} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[#f85149] hover:bg-[#f85149]/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Delete Board</h3>
            {deleteConfirm.cardCount > 0 ? (
              <p className="text-sm text-[#d29922]">
                This board has <strong>{deleteConfirm.cardCount}</strong> card{deleteConfirm.cardCount !== 1 ? "s" : ""}. Deleting it will permanently remove all cards. Are you sure?
              </p>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Are you sure you want to delete "{deleteConfirm.board.name}"?</p>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-sm text-[var(--text-muted)]">Cancel</button>
              <button onClick={confirmDelete} className="px-3 py-1.5 rounded-md bg-[#f85149] text-white text-sm font-medium hover:bg-[#f85149]/90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
