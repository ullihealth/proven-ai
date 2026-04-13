import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, RefreshCw, Info } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TierRow {
  id: number;
  tier: number;
  tier_name: string;
  monthly_credits: number;
  weight_groq: number;
  weight_gemini: number;
  weight_claude: number;
  updated_at: string;
}

type DraftRow = Omit<TierRow, "id" | "updated_at">;

const TIER_DESCRIPTIONS: Record<number, string> = {
  0: "Guest users authenticated via a one-time token (pg_guest_tokens)",
  1: "Logged-in free members (role = member)",
  2: "Standard paid members (tier 1 Stripe)",
  3: "Advanced paid members (tier 2+ Stripe)",
};

const PgLimitsManagement = () => {
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [drafts, setDrafts] = useState<Record<number, DraftRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/pg-limits", { credentials: "include", signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { tiers: TierRow[] };
      if (!signal?.aborted) {
        setTiers(data.tiers);
        const initial: Record<number, DraftRow> = {};
        data.tiers.forEach((row) => {
          initial[row.tier] = {
            tier: row.tier,
            tier_name: row.tier_name,
            monthly_credits: row.monthly_credits,
            weight_groq: row.weight_groq,
            weight_gemini: row.weight_gemini,
            weight_claude: row.weight_claude,
          };
        });
        setDrafts(initial);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      if (!signal?.aborted) setLoadError(e instanceof Error ? e.message : "Failed to load limits");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const updateDraft = (tier: number, field: keyof DraftRow, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [field]: field === "tier_name" ? value : parseFloat(value) || 0,
      },
    }));
    // Clear saved/error state on change
    setSaved((prev) => ({ ...prev, [tier]: false }));
    setErrors((prev) => ({ ...prev, [tier]: "" }));
  };

  const handleSave = async (tier: number) => {
    const draft = drafts[tier];
    if (!draft) return;

    setSaving((prev) => ({ ...prev, [tier]: true }));
    setErrors((prev) => ({ ...prev, [tier]: "" }));

    try {
      const res = await fetch("/api/admin/pg-limits", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [tier]: data.error ?? `HTTP ${res.status}` }));
      } else {
        setSaved((prev) => ({ ...prev, [tier]: true }));
        // Update the local tiers list with new values
        setTiers((prev) =>
          prev.map((row) =>
            row.tier === tier
              ? { ...row, ...draft, updated_at: new Date().toISOString() }
              : row
          )
        );
        setTimeout(() => setSaved((prev) => ({ ...prev, [tier]: false })), 2500);
      }
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [tier]: e instanceof Error ? e.message : "Save failed",
      }));
    } finally {
      setSaving((prev) => ({ ...prev, [tier]: false }));
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader
          title="Prompt Credit Limits"
          description="Configure monthly credit allowances and per-model weights for each membership tier."
        />
        <div className="flex items-center gap-3 text-muted-foreground text-sm py-12">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading tier limits…
        </div>
      </AppLayout>
    );
  }

  if (loadError) {
    return (
      <AppLayout>
        <PageHeader
          title="Prompt Credit Limits"
          description="Configure monthly credit allowances and per-model weights for each membership tier."
        />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 max-w-md">
          {loadError}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Prompt Credit Limits"
        description="Configure monthly credit allowances and per-model weights for each membership tier."
      />

      <div className="space-y-6 max-w-3xl">

        {/* Refresh */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => load()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Weight explanation */}
        <div
          className="rounded-lg px-4 py-3 text-sm flex gap-3 items-start"
          style={{
            backgroundColor: "rgba(0,188,212,0.06)",
            border: "1px solid rgba(0,188,212,0.2)",
            color: "rgba(201,209,217,0.75)",
          }}
        >
          <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#00bcd4" }} />
          <div>
            <strong style={{ color: "#c9d1d9" }}>Model weights</strong> determine how many
            credits each AI model costs per generation. Example: Groq = 1 credit, Gemini = 2
            credits, Claude = 3 credits. A user with 30 monthly credits could run 30 Groq
            generations, 15 Gemini, or 10 Claude.
          </div>
        </div>

        {/* Tier cards */}
        {tiers.map((row) => {
          const draft = drafts[row.tier];
          if (!draft) return null;
          const isSaving = saving[row.tier] ?? false;
          const isSaved = saved[row.tier] ?? false;
          const errorMsg = errors[row.tier] ?? "";
          const updatedAt = new Date(row.updated_at).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
          });

          return (
            <Card key={row.tier}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-base">Tier {row.tier} — {row.tier_name}</span>
                    <p className="text-xs font-normal text-muted-foreground mt-0.5">
                      {TIER_DESCRIPTIONS[row.tier] ?? ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-normal whitespace-nowrap">
                    Updated {updatedAt}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Monthly credits */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">
                    Monthly credit allowance
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.monthly_credits}
                    onChange={(e) => updateDraft(row.tier, "monthly_credits", e.target.value)}
                    className="w-32 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Total credits available per calendar month per user in this tier.
                  </p>
                </div>

                {/* Model weights */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Model weights (credits per generation)</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(["groq", "gemini", "claude"] as const).map((model) => {
                      const field = `weight_${model}` as keyof DraftRow;
                      return (
                        <div key={model} className="space-y-1">
                          <label className="block text-xs text-muted-foreground capitalize">
                            {model === "groq" ? "Groq" : model === "gemini" ? "Gemini" : "Claude"}
                          </label>
                          <input
                            type="number"
                            min={0.1}
                            step={0.5}
                            value={draft[field] as number}
                            onChange={(e) => updateDraft(row.tier, field, e.target.value)}
                            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save row */}
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleSave(row.tier)}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Save className="h-3.5 w-3.5" />
                    }
                    {isSaving ? "Saving…" : "Save changes"}
                  </Button>
                  {isSaved && (
                    <span className="text-xs text-green-400">Saved!</span>
                  )}
                  {errorMsg && (
                    <span className="text-xs text-red-400">{errorMsg}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default PgLimitsManagement;
