import { useState, useEffect, useCallback } from "react";
import { BookOpen, Users, Loader2, RefreshCw } from "lucide-react";
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
    const d = new Date(iso + "Z"); // D1 stores UTC without Z suffix
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => load(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
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
                    </tr>
                  </thead>
                  <tbody>
                    {signups.map((s, i) => (
                      <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{total - i}</td>
                        <td className="px-4 py-2.5 text-foreground">{s.firstname || "—"}</td>
                        <td className="px-4 py-2.5 text-foreground font-mono text-xs">{s.email}</td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{formatDate(s.created_at)}</td>
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

export default BookSignups;
