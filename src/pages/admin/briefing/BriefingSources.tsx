import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import {
  Loader2,
  Plus,
  Check,
  X,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Source {
  id: string;
  name: string;
  url: string;
  category_hint: string | null;
  enabled: number;
  created_at: string;
  publishing_mode: string | null;
  summary_override: string | null;
}

const CATEGORY_OPTIONS = [
  { value: "", label: "Auto-detect" },
  { value: "ai_news", label: "AI News" },
  { value: "ai_robotics", label: "AI Robotics" },
  { value: "ai_medicine", label: "AI Medicine" },
  { value: "ai_business", label: "AI Business" },
];

const PUBLISHING_OPTIONS = [
  { value: "auto", label: "Auto-publish" },
  { value: "manual", label: "Manual (pending queue)" },
];

const SUMMARY_OPTIONS = [
  { value: "", label: "Use global default" },
  { value: "headlines", label: "Headlines only" },
  { value: "short", label: "Short" },
  { value: "standard", label: "Standard" },
  { value: "extended", label: "Extended" },
];

const BriefingSources = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPublishing, setNewPublishing] = useState("auto");
  const [newSummaryOverride, setNewSummaryOverride] = useState("");

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPublishing, setEditPublishing] = useState("auto");
  const [editSummaryOverride, setEditSummaryOverride] = useState("");

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/briefing/sources");
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleAdd = async () => {
    if (!newName.trim() || !newUrl.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/briefing/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          url: newUrl.trim(),
          category_hint: newCategory || null,
          enabled: true,
          publishing_mode: newPublishing || "auto",
          summary_override: newSummaryOverride || null,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewUrl("");
        setNewCategory("");
        setNewPublishing("auto");
        setNewSummaryOverride("");
        setShowAdd(false);
        fetchSources();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (source: Source) => {
    const newEnabled = source.enabled ? false : true;
    try {
      await fetch("/api/admin/briefing/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: source.id, enabled: newEnabled }),
      });
      setSources((prev) =>
        prev.map((s) =>
          s.id === source.id ? { ...s, enabled: newEnabled ? 1 : 0 } : s
        )
      );
    } catch {
      // ignore
    }
  };

  const startEdit = (source: Source) => {
    setEditingId(source.id);
    setEditName(source.name);
    setEditUrl(source.url);
    setEditCategory(source.category_hint || "");
    setEditPublishing(source.publishing_mode || "auto");
    setEditSummaryOverride(source.summary_override || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim() || !editUrl.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/briefing/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editName.trim(),
          url: editUrl.trim(),
          category_hint: editCategory || null,
          publishing_mode: editPublishing || "auto",
          summary_override: editSummaryOverride || null,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchSources();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Briefing Sources"
        description="Manage RSS feeds that power the AI Intelligence Briefing."
      />

      {/* Add source button */}
      <div className="mb-6">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Source
          </button>
        ) : (
          <div className="bg-card border border-border rounded-xl p-5 space-y-3 max-w-xl">
            <h3 className="text-sm font-semibold text-foreground">
              New RSS Source
            </h3>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Name
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. The Verge – AI"
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Feed URL
              </label>
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/rss.xml"
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Category hint
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Publishing mode
              </label>
              <select
                value={newPublishing}
                onChange={(e) => setNewPublishing(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {PUBLISHING_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Summary override
              </label>
              <select
                value={newSummaryOverride}
                onChange={(e) => setNewSummaryOverride(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {SUMMARY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving || !newName.trim() || !newUrl.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sources list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sources.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No sources configured yet. Add your first RSS feed above.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((source) => {
            const isEditing = editingId === source.id;

            if (isEditing) {
              return (
                <div
                  key={source.id}
                  className="bg-card border border-primary/30 rounded-xl p-5 space-y-3 max-w-xl"
                >
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Name
                    </label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Feed URL
                    </label>
                    <input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Category hint
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Publishing mode
                    </label>
                    <select
                      value={editPublishing}
                      onChange={(e) => setEditPublishing(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {PUBLISHING_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Summary override
                    </label>
                    <select
                      value={editSummaryOverride}
                      onChange={(e) => setEditSummaryOverride(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {SUMMARY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={
                        saving || !editName.trim() || !editUrl.trim()
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={source.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card border border-border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        source.enabled ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
                    <p className="text-sm font-medium text-foreground truncate">
                      {source.name}
                    </p>
                    {source.category_hint && (
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {source.category_hint}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5 pl-4">
                    {source.url}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(source)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title={source.enabled ? "Disable" : "Enable"}
                  >
                    {source.enabled ? (
                      <ToggleRight className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(source)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default BriefingSources;
