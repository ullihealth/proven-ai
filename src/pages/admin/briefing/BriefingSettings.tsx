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

const REFRESH_MODES = [
  { value: "daily", label: "Daily" },
  { value: "3x_week", label: "3× per week" },
  { value: "weekly", label: "Weekly" },
  { value: "manual", label: "Manual only" },
];

const BriefingSettings = () => {
  // Config state
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Run state
  const [runs, setRuns] = useState<RunInfo[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [runResult, setRunResult] = useState<string | null>(null);
  const [sourceErrors, setSourceErrors] = useState<{ source: string; error: string }[]>([]);

  // Fetch config
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/briefing/config");
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings || {});
        }
      } catch {
        // Will show defaults
      } finally {
        setLoadingConfig(false);
      }
    })();
  }, []);

  // Fetch runs
  useEffect(() => {
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

      // Guard: only parse JSON if the response is actually JSON
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const body = await res.text();
        setRunStatus("error");
        setRunResult(
          `Server returned non-JSON response (${res.status}). ` +
          (body.length > 120 ? body.slice(0, 120) + "…" : body)
        );
        return;
      }

      const data = await res.json();
      if (data.ok) {
        const summary = `Fetched ${data.itemsFetched ?? 0} items, ${data.itemsCreated ?? 0} new, ${data.itemsUpdated ?? 0} duplicates skipped.`;
        if (data.sourceErrors && data.sourceErrors.length > 0) {
          setRunStatus("success");
          setRunResult(`${summary} (${data.sourceErrors.length} source(s) had errors)`);
          setSourceErrors(data.sourceErrors);
        } else {
          setRunStatus("success");
          setRunResult(summary);
        }
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

  const lastRun = runs[0] || null;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Briefing Settings"
        description="Configure the AI Intelligence Briefing pipeline — refresh cadence, limits, and manual triggers."
      />

      {loadingConfig ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Configuration */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Configuration
            </h2>
            <div className="space-y-4 max-w-xl">
              {/* Refresh Mode */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Refresh Mode
                </label>
                <select
                  value={settings.BRIEFING_REFRESH_MODE || "daily"}
                  onChange={(e) =>
                    updateSetting("BRIEFING_REFRESH_MODE", e.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {REFRESH_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Controls how often the scheduled job fetches new items. Cron runs daily; this setting determines whether the job self-skips.
                </p>
              </div>

              {/* Max Visible Items */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Max visible items (dashboard)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.BRIEFING_MAX_ITEMS_VISIBLE || "4"}
                  onChange={(e) =>
                    updateSetting("BRIEFING_MAX_ITEMS_VISIBLE", e.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Max Stored Items */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Max stored items (before pruning)
                </label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={settings.BRIEFING_MAX_ITEMS_STORED || "200"}
                  onChange={(e) =>
                    updateSetting("BRIEFING_MAX_ITEMS_STORED", e.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Min Hours Between Runs */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Min hours between runs
                </label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={settings.BRIEFING_MIN_HOURS_BETWEEN_RUNS || "20"}
                  onChange={(e) =>
                    updateSetting(
                      "BRIEFING_MIN_HOURS_BETWEEN_RUNS",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Safety throttle — the scheduled job won't run again until this many hours have passed since the last successful run.
                </p>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={savingConfig}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {savingConfig ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : configSaved ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {configSaved ? "Saved" : "Save Settings"}
              </button>
            </div>
          </section>

          {/* Run Briefing */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Run Briefing Update
            </h2>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Fetch latest RSS items, deduplicate, and publish to the
                    Control Centre widget.
                  </p>
                  {runResult && (
                    <p
                      className={`text-sm mt-1.5 ${
                        runStatus === "error"
                          ? "text-red-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {runResult}
                    </p>
                  )}
                  {sourceErrors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-amber-500">Source errors:</p>
                      {sourceErrors.map((se, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          <span className="font-medium text-amber-400">{se.source}:</span>{" "}
                          {se.error}
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
                  {runStatus === "running" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Running…
                    </>
                  ) : runStatus === "success" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Done
                    </>
                  ) : runStatus === "error" ? (
                    <>
                      <XCircle className="h-4 w-4" /> Retry
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" /> Run Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Run History */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Recent Runs
            </h2>
            {loadingRuns ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No runs recorded yet. Use "Run Now" to trigger the first one.
              </p>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-card border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          run.status === "success"
                            ? "bg-emerald-500"
                            : run.status === "running"
                            ? "bg-amber-500 animate-pulse"
                            : "bg-red-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm text-foreground">
                          <Clock className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {formatDate(run.started_at)}
                          {run.finished_at && (
                            <span className="text-muted-foreground">
                              {" "}→ {formatDate(run.finished_at)}
                            </span>
                          )}
                        </p>
                        {run.error_message && (
                          <p className="text-xs text-red-400 mt-0.5 truncate max-w-md">
                            {run.error_message}
                          </p>
                        )}
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

export default BriefingSettings;
