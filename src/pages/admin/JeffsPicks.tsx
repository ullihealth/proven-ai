import { useState, useEffect, useCallback } from "react";
import { X, Plus, Search, Loader2, Star } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { categoryInfo } from "@/data/directoryToolsData";
import { useTools } from "@/lib/tools";
import { jeffsPicksCategories } from "@/data/jeffsPicksData";

type CategoryPicks = { category: string; tools: string[] };

const CATEGORY_NAMES = jeffsPicksCategories.map((c) => c.name);

const AdminJeffsPicks = () => {
  const { toast } = useToast();
  const { tools: allTools } = useTools();
  const [picks, setPicks] = useState<CategoryPicks[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Add-tool panel state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_NAMES[0]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/jeffs-picks", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { picks: CategoryPicks[] };
      setPicks(data.picks ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load picks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Get tool IDs currently in a category
  const toolsInCategory = (category: string): string[] =>
    picks.find((p) => p.category === category)?.tools ?? [];

  const handleRemove = async (toolId: string, category: string) => {
    const key = `${category}::${toolId}`;
    setRemoving(key);
    try {
      const res = await fetch("/api/admin/jeffs-picks", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_id: toolId, category }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: "Removed", description: `${toolId} removed from ${category}.` });
      await load();
    } catch {
      toast({ title: "Error", description: "Failed to remove tool.", variant: "destructive" });
    } finally {
      setRemoving(null);
    }
  };

  const handleAdd = async (toolId: string) => {
    setAdding(true);
    try {
      const res = await fetch("/api/admin/jeffs-picks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_id: toolId, category: selectedCategory }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: "Added", description: `${toolId} added to ${selectedCategory}.` });
      await load();
    } catch {
      toast({ title: "Error", description: "Failed to add tool.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const filteredTools = allTools.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      (categoryInfo[t.primaryCategory]?.label ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout>
      <PageHeader
        title="Jeff's Picks"
        description="Manage the tools shown on the Jeff's Picks page, grouped by category."
      />

      {loadError && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left panel: Current Picks ──────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-5">Current Picks</h2>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="space-y-6">
              {CATEGORY_NAMES.map((cat) => {
                const toolIds = toolsInCategory(cat);
                return (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {cat}
                    </p>
                    {toolIds.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No tools added yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {toolIds.map((id) => {
                          const tool = allTools.find((t) => t.id === id);
                          const key = `${cat}::${id}`;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-muted border border-border text-foreground"
                            >
                              {tool?.name ?? id}
                              <button
                                onClick={() => handleRemove(id, cat)}
                                disabled={removing === key}
                                className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                aria-label={`Remove ${id} from ${cat}`}
                              >
                                {removing === key
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <X className="h-3 w-3" />
                                }
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right panel: Add a Tool ─────────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-5">Add a Tool</h2>

          {/* Category selector */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Add to category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {CATEGORY_NAMES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search tools…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Tool list */}
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredTools.map((tool) => {
              const alreadyInCategory = toolsInCategory(selectedCategory).includes(tool.id);
              return (
                <div
                  key={tool.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {categoryInfo[tool.primaryCategory]?.label ?? tool.primaryCategory}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyInCategory ? "outline" : "default"}
                    disabled={alreadyInCategory || adding}
                    onClick={() => handleAdd(tool.id)}
                    className="flex-shrink-0 h-7 px-2.5 text-xs"
                  >
                    {alreadyInCategory ? (
                      "Added"
                    ) : adding ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <><Plus className="h-3 w-3 mr-1" />Add</>
                    )}
                  </Button>
                </div>
              );
            })}
            {filteredTools.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No tools match "{search}"</p>
            )}
          </div>
        </div>
      </div>

      {/* Migrate helper */}
      <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground flex items-start gap-3">
        <Star className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
        <span>
          First time setup: visit{" "}
          <a
            href="/api/admin/jeffs-picks/migrate"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            /api/admin/jeffs-picks/migrate
          </a>{" "}
          to create the database table.
        </span>
      </div>
    </AppLayout>
  );
};

export default AdminJeffsPicks;
