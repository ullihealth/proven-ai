import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
  Clock,
} from "lucide-react";

interface RunInfo {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  items_fetched: number;
  items_created: number;
  items_updated: number;
  error_message: string | null;
}

/* ─── Option maps ─── */
const SUMMARY_MODES = [
  { value: "headlines", label: "Headlines only" },
  { value: "short", label: "Short (80–120 words)" },
  { value: "standard", label: "Standard (150–200 words)" },
  { value: "extended", label: "Extended (250–350 words)" },
];

const REFRESH_MODES = [
  { value: "rolling", label: "Rolling (every X hours)" },
  { value: "daily_brief", label: "Daily Brief (publish once per day)" },
];

const LEGACY_REFRESH_MODES = [
  { value: "daily", label: "Daily" },
  { value: "3x_week", label: "3× per week" },
  { value: "weekly", label: "Weekly" },
  { value: "manual", label: "Manual only" },
];

const IntelligenceSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  const [runs, setRuns] = useState<RunInfo[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [runResult, setRunResult] = useState<string | null>(null);
  const [sourceErrors, setSourceErrors] = useState<{ source: string; error: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/briefing/config");
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings || {});
        }
      } catch {
        // defaults
      } finally {
        setLoadingConfig(false);
      }
    })();
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    setLoadingRuns(true);
    try {
      const res = await fetch("/api/admin/briefing/runs?limit=5");
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingRuns(false);
    }
  };

  const handleSave = async () => {
    setSavingConfig(true);
    setConfigSaved(false);
    try {
      const res = await fetch("/api/admin/briefing/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSavingConfig(false);
    }
  };

  const runBriefingUpdate = async () => {
    setRunStatus("running");
    setRunResult(null);
    setSourceErrors([]);
    try {
      const res = await fetch("/api/admin/briefing/run", { method: "POST" });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const body = await res.text();
        setRunStatus("error");
        setRunResult(`Non-JSON response (${res.status}). ${body.slice(0, 120)}`);
        return;
      }
      const data = await res.json();
      if (data.ok) {
        const summary = `Fetched ${data.itemsFetched ?? 0}, ${data.itemsCreated ?? 0} new, ${data.itemsUpdated ?? 0} dupes.`;
        setRunStatus("success");
        setRunResult(data.sourceErrors?.length ? `${summary} (${data.sourceErrors.length} source errors)` : summary);
        if (data.sourceErrors) setSourceErrors(data.sourceErrors);
        fetchRuns();
      } else {
        setRunStatus("error");
        setRunResult(data.error || "Unknown error");
        if (data.sourceErrors) setSourceErrors(data.sourceErrors);
      }
    } catch (err) {
      setRunStatus("error");
      setRunResult(err instanceof Error ? err.message : "Network error");
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setConfigSaved(false);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-GB", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  /* ─── Shared select styling ─── */
  const selectCls = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
  const inputCls = selectCls;

  return (
    <AppLayout>
      <PageHeader
        title="Intelligence Settings"
        description="Configure the AI Intelligence engine — summary depth, refresh cadence, article view, and manual triggers."
      />

      {loadingConfig ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* ═══ Global Intelligence Config ═══ */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Intelligence Engine</h2>
            <div className="space-y-5 max-w-xl">

              {/* Summary Mode */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Summary Mode (global default)</label>
                <select
                  value={settings.INTEL_SUMMARY_MODE || "standard"}
                  onChange={(e) => updateSetting("INTEL_SUMMARY_MODE", e.target.value)}
                  className={selectCls}
                >
                  {SUMMARY_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Controls summary length displayed in the intelligence column. Can be overridden per feed on the Sources page.</p>
              </div>

              {/* Refresh Mode */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Refresh Mode</label>
                <select
                  value={settings.INTEL_REFRESH_MODE || "rolling"}
                  onChange={(e) => updateSetting("INTEL_REFRESH_MODE", e.target.value)}
                  className={selectCls}
                >
                  {REFRESH_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Rolling interval (show only if rolling) */}
              {(settings.INTEL_REFRESH_MODE || "rolling") === "rolling" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Rolling interval (hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={settings.INTEL_ROLLING_HOURS || "6"}
                    onChange={(e) => updateSetting("INTEL_ROLLING_HOURS", e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}

              {/* In-App Article View */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">In-App Article View</p>
                  <p className="text-xs text-muted-foreground">Headlines open an internal reader page instead of external link.</p>
                </div>
                <button
                  onClick={() => updateSetting("INTEL_ARTICLE_VIEW", (settings.INTEL_ARTICLE_VIEW || "on") === "on" ? "off" : "on")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    (settings.INTEL_ARTICLE_VIEW || "on") === "on" ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    (settings.INTEL_ARTICLE_VIEW || "on") === "on" ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>

              {/* Founder Commentary */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Founder Commentary</p>
                  <p className="text-xs text-muted-foreground">Show "Why this matters" commentary below each summary.</p>
                </div>
                <button
                  onClick={() => updateSetting("INTEL_COMMENTARY", (settings.INTEL_COMMENTARY || "off") === "on" ? "off" : "on")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    (settings.INTEL_COMMENTARY || "off") === "on" ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    (settings.INTEL_COMMENTARY || "off") === "on" ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
            </div>
          </section>

          {/* ═══ Legacy Pipeline Settings ═══ */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Pipeline Settings</h2>
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Scheduled refresh cadence</label>
                <select
                  value={settings.BRIEFING_REFRESH_MODE || "daily"}
                  onChange={(e) => updateSetting("BRIEFING_REFRESH_MODE", e.target.value)}
                  className={selectCls}
                >
                  {LEGACY_REFRESH_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Items per category</label>
                <input type="number" min={1} max={5} value={settings.INTEL_ITEMS_PER_CATEGORY || "2"} onChange={(e) => updateSetting("INTEL_ITEMS_PER_CATEGORY", e.target.value)} className={inputCls} />
                <p className="text-xs text-muted-foreground mt-1">Number of items shown for each category in the right column (1-5)</p>
              </div>
              <div>                <label className="block text-sm font-medium text-foreground mb-1.5">Max visible items (dashboard)</label>
                <input type="number" min={1} max={20} value={settings.BRIEFING_MAX_ITEMS_VISIBLE || "8"} onChange={(e) => updateSetting("BRIEFING_MAX_ITEMS_VISIBLE", e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Max stored items (before pruning)</label>
                <input type="number" min={10} max={1000} value={settings.BRIEFING_MAX_ITEMS_STORED || "200"} onChange={(e) => updateSetting("BRIEFING_MAX_ITEMS_STORED", e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Min hours between runs</label>
                <input type="number" min={1} max={168} value={settings.BRIEFING_MIN_HOURS_BETWEEN_RUNS || "20"} onChange={(e) => updateSetting("BRIEFING_MIN_HOURS_BETWEEN_RUNS", e.target.value)} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Save */}
          <div className="mb-10">
            <button
              onClick={handleSave}
              disabled={savingConfig}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : configSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {configSaved ? "Saved" : "Save Settings"}
            </button>
          </div>

          {/* ═══ Run Briefing ═══ */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Run Briefing Update</h2>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground font-medium">Fetch latest RSS items, deduplicate, and publish to the Control Centre.</p>
                  {runResult && (
                    <p className={`text-sm mt-1.5 ${runStatus === "error" ? "text-red-500" : "text-emerald-500"}`}>
                      {runResult}
                    </p>
                  )}
                  {sourceErrors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-amber-500">Source errors:</p>
                      {sourceErrors.map((se, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          <span className="font-medium text-amber-400">{se.source}:</span> {se.error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={runBriefingUpdate}
                  disabled={runStatus === "running"}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {runStatus === "running" ? <><Loader2 className="h-4 w-4 animate-spin" /> Running…</> :
                   runStatus === "success" ? <><CheckCircle2 className="h-4 w-4" /> Done</> :
                   runStatus === "error" ? <><XCircle className="h-4 w-4" /> Retry</> :
                   <><RefreshCw className="h-4 w-4" /> Run Now</>}
                </button>
              </div>
            </div>
          </section>

          {/* ═══ Run History ═══ */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Runs</h2>
            {loadingRuns ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No runs yet. Trigger one above.</p>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => (
                  <div key={run.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        run.status === "success" ? "bg-emerald-500" : run.status === "running" ? "bg-amber-500 animate-pulse" : "bg-red-500"
                      }`} />
                      <div>
                        <p className="text-sm text-foreground">
                          <Clock className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {formatDate(run.started_at)}
                          {run.finished_at && <span className="text-muted-foreground"> → {formatDate(run.finished_at)}</span>}
                        </p>
                        {run.error_message && <p className="text-xs text-red-400 mt-0.5 truncate max-w-md">{run.error_message}</p>}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 pl-5 sm:pl-0">
                      <span>{run.items_fetched} fetched</span>
                      <span>{run.items_created} new</span>
                      <span>{run.items_updated} dupes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AppLayout>
  );
};

export default IntelligenceSettings;
