import { useState, useEffect, useCallback } from "react";
import { BookOpen, Users, Loader2, RefreshCw, Trash2, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Signup {
  id: number;
  email: string;
  firstname: string;
  source: string;
  created_at: string;
}

const BookSignups = () => {
  const [total, setTotal] = useState(0);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Per-row delete confirmation state: maps id → "confirming" | "deleting"
  const [deleteState, setDeleteState] = useState<Record<number, "confirming" | "deleting">>({});

  // Clear All modal state
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearPhrase, setClearPhrase] = useState("");
  const [clearPassword, setClearPassword] = useState("");
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch("/api/admin/book-signups?limit=100", { credentials: "include" });
      const data = await res.json() as { success?: boolean; total?: number; signups?: Signup[] };
      if (data.success) {
        setTotal(data.total ?? 0);
        setSignups(data.signups ?? []);
      }
    } catch {
      // leave current state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatDate = (iso: string) => {
    const d = new Date(iso + "Z");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const handleDeleteOne = async (id: number) => {
    setDeleteState((s) => ({ ...s, [id]: "deleting" }));
    try {
      await fetch(`/api/admin/book-signups/${id}`, { method: "DELETE", credentials: "include" });
      setSignups((prev) => prev.filter((x) => x.id !== id));
      setTotal((t) => t - 1);
    } catch {
      // restore confirm state on error
      setDeleteState((s) => ({ ...s, [id]: "confirming" }));
      return;
    }
    setDeleteState((s) => { const next = { ...s }; delete next[id]; return next; });
  };

  const handleClearAll = async () => {
    setClearing(true);
    setClearError(null);
    try {
      const res = await fetch("/api/admin/book-signups", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: clearPassword }),
      });
      if (res.status === 403) {
        setClearError("Incorrect password. Please try again.");
        setClearing(false);
        return;
      }
      if (!res.ok) {
        setClearError("Server error. Please try again.");
        setClearing(false);
        return;
      }
      setSignups([]);
      setTotal(0);
      setClearModalOpen(false);
      setClearPhrase("");
      setClearPassword("");
    } catch {
      setClearError("Network error. Please try again.");
    } finally {
      setClearing(false);
    }
  };

  const clearModalValid = clearPhrase === "DELETE ALL" && clearPassword.length > 0;

  return (
    <AppLayout>
      <PageHeader title="Book Signups" description="Lead capture tracking for the free book landing page." />

      <div className="space-y-6 max-w-3xl">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total signups</p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? "..." : total.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="text-sm font-medium text-foreground">provenai.app/book</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Signups table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base">Recent signups</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => load(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => { setClearModalOpen(true); setClearPhrase(""); setClearPassword(""); setClearError(null); }}
                disabled={loading || signups.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : signups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No signups yet. Share your book page to start capturing leads.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">#</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {signups.map((s, i) => {
                      const ds = deleteState[s.id];
                      return (
                        <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{total - i}</td>
                          <td className="px-4 py-2.5 text-foreground">{s.firstname || "—"}</td>
                          <td className="px-4 py-2.5 text-foreground font-mono text-xs">{s.email}</td>
                          <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{formatDate(s.created_at)}</td>
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            {ds === "confirming" ? (
                              <span className="inline-flex items-center gap-1 text-xs">
                                <span className="text-muted-foreground">Delete?</span>
                                <button
                                  onClick={() => handleDeleteOne(s.id)}
                                  className="text-destructive font-semibold hover:underline"
                                >Yes</button>
                                <span className="text-muted-foreground">/</span>
                                <button
                                  onClick={() => setDeleteState((p) => { const n = { ...p }; delete n[s.id]; return n; })}
                                  className="text-muted-foreground hover:underline"
                                >No</button>
                              </span>
                            ) : ds === "deleting" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground inline" />
                            ) : (
                              <button
                                onClick={() => setDeleteState((p) => ({ ...p, [s.id]: "confirming" }))}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                title="Delete signup"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clear All modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Clear All Signups</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This permanently deletes all {total} signup records and cannot be undone.
                </p>
              </div>
              <button onClick={() => setClearModalOpen(false)} className="text-muted-foreground hover:text-foreground ml-4 mt-0.5">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Type <span className="font-mono text-foreground">DELETE ALL</span> to confirm
                </label>
                <input
                  type="text"
                  value={clearPhrase}
                  onChange={(e) => setClearPhrase(e.target.value)}
                  placeholder="DELETE ALL"
                  className="w-full px-3 py-2 rounded-md bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:border-destructive focus:outline-none"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Admin password
                </label>
                <input
                  type="password"
                  value={clearPassword}
                  onChange={(e) => { setClearPassword(e.target.value); setClearError(null); }}
                  placeholder="Enter admin password"
                  className="w-full px-3 py-2 rounded-md bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:border-destructive focus:outline-none"
                  autoComplete="current-password"
                />
              </div>
              {clearError && (
                <p className="text-xs text-destructive">{clearError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setClearModalOpen(false)} disabled={clearing}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                disabled={!clearModalValid || clearing}
              >
                {clearing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
                Delete All Records
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default BookSignups;

