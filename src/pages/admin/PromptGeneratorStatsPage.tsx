import { useState, useEffect, useCallback } from "react";
import { WandSparkles, Users, Zap, BarChart3, RefreshCw, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ModelBreakdown {
  model: string;
  count: number;
}

interface UserTypeBreakdown {
  user_type: string;
  count: number;
}

interface RecentRow {
  user_identifier: string;
  user_type: string;
  model: string;
  used_at: string;
}

interface StatsData {
  totals: { today: number; this_week: number; all_time: number };
  by_model: ModelBreakdown[];
  by_user_type: UserTypeBreakdown[];
  recent: RecentRow[];
}

const MODEL_LABELS: Record<string, string> = {
  groq: "Groq",
  gemini: "Gemini",
  claude: "Claude",
};

const USER_TYPE_LABELS: Record<string, string> = {
  paid_member: "Paid Members",
  free_subscriber: "Free Subscribers",
};

const USER_TYPE_COLORS: Record<string, string> = {
  paid_member: "#00bcd4",
  free_subscriber: "#e91e8c",
};

const MODEL_COLORS: Record<string, string> = {
  groq: "#00bcd4",
  gemini: "#4285f4",
  claude: "#c47d4d",
};

const PromptGeneratorStatsPage = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false, signal?: AbortSignal) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/prompt-generator/stats", { credentials: "include", signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as StatsData;
      if (!signal?.aborted) setStats(data);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      if (!signal?.aborted) setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(false, controller.signal);
    return () => controller.abort();
  }, [load]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Prompt Generator" description="Usage statistics for the AI Prompt Generator tool." />
        <div className="flex items-center gap-3 text-muted-foreground text-sm py-12">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading stats…
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <PageHeader title="Prompt Generator" description="Usage statistics for the AI Prompt Generator tool." />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 max-w-md">
          {error}
        </div>
      </AppLayout>
    );
  }

  const allTimeTotal = stats?.totals?.all_time ?? 0;

  return (
    <AppLayout>
      <PageHeader
        title="Prompt Generator"
        description="Usage statistics for the AI Prompt Generator tool."
      />

      <div className="space-y-6 max-w-4xl">

        {/* Refresh */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(true)}
            disabled={refreshing}
            className="gap-2"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {/* Totals row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Today", value: stats?.totals?.today ?? 0, icon: Zap },
            { label: "This Week", value: stats?.totals?.this_week ?? 0, icon: BarChart3 },
            { label: "All Time", value: stats?.totals?.all_time ?? 0, icon: WandSparkles },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 py-5">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {value.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Breakdown row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* By model */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                By Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(stats?.by_model ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No data yet.</div>
              ) : (
                (stats?.by_model ?? []).map(({ model, count }) => {
                  const pct = allTimeTotal > 0 ? Math.round((count / allTimeTotal) * 100) : 0;
                  return (
                    <div key={model} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">{MODEL_LABELS[model] ?? model}</span>
                        <span className="text-muted-foreground">{count.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: MODEL_COLORS[model] ?? "#888" }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* By user type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                By User Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(stats?.by_user_type ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No data yet.</div>
              ) : (
                (stats?.by_user_type ?? []).map(({ user_type, count }) => {
                  const pct = allTimeTotal > 0 ? Math.round((count / allTimeTotal) * 100) : 0;
                  return (
                    <div key={user_type} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">{USER_TYPE_LABELS[user_type] ?? user_type}</span>
                        <span className="text-muted-foreground">{count.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: USER_TYPE_COLORS[user_type] ?? "#888" }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent activity table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recent Activity (last 20)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(stats?.recent ?? []).length === 0 ? (
              <div className="px-6 py-8 text-sm text-muted-foreground text-center">No prompts generated yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground text-xs uppercase tracking-wide">
                      <th className="px-6 py-3 text-left font-medium">User</th>
                      <th className="px-6 py-3 text-left font-medium">Type</th>
                      <th className="px-6 py-3 text-left font-medium">Model</th>
                      <th className="px-6 py-3 text-left font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recent ?? []).map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-3 font-mono text-foreground">{row.user_identifier}</td>
                        <td className="px-6 py-3">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: (USER_TYPE_COLORS[row.user_type] ?? "#888") + "22",
                              color: USER_TYPE_COLORS[row.user_type] ?? "#888",
                            }}
                          >
                            {USER_TYPE_LABELS[row.user_type] ?? row.user_type}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: (MODEL_COLORS[row.model] ?? "#888") + "22",
                              color: MODEL_COLORS[row.model] ?? "#888",
                            }}
                          >
                            {MODEL_LABELS[row.model] ?? row.model}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{formatDate(row.used_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
};

export default PromptGeneratorStatsPage;
