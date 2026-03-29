import { useState, useEffect, useCallback } from "react";
import { CreditCard, Users, TrendingUp, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TierBreakdown {
  tier: number;
  count: number;
}

interface RecentSignup {
  email: string;
  tier: number;
  price_paid: number;
  signed_up_at: string;
}

interface MembershipStatsData {
  total_paid_members: number;
  by_tier: TierBreakdown[];
  recent: RecentSignup[];
  current_tier: {
    tier: number;
    price_usd: number;
    spots_remaining: number;
    tier_limit: number;
    members_at_this_tier: number;
  };
}

const TIER_LABELS: Record<number, string> = {
  1: "Tier 1 — $97",
  2: "Tier 2 — $197",
  3: "Tier 3 — $497",
};

export default function MembershipStatsPage() {
  const [data, setData] = useState<MembershipStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/membership/stats", {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const d = await res.json();
      setData(d as MembershipStatsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Membership"
            description="Founding member signups and tier status."
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://dashboard.stripe.com/payments"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5"
              >
                Stripe Dashboard
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load: {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {data && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Paid Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.total_paid_members}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Current Tier
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    Tier {data.current_tier.tier}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${data.current_tier.price_usd} per member
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Spots Remaining
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {data.current_tier.tier === 3
                      ? "—"
                      : data.current_tier.spots_remaining}
                  </div>
                  {data.current_tier.tier < 3 && (
                    <div className="text-sm text-muted-foreground">
                      at current price
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tier progress */}
            {data.current_tier.tier < 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Tier {data.current_tier.tier} Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="w-full h-3 rounded-full overflow-hidden bg-muted">
                    <div
                      className="h-3 rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (data.current_tier.members_at_this_tier /
                              data.current_tier.tier_limit) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{data.current_tier.members_at_this_tier} joined</span>
                    <span>{data.current_tier.tier_limit} total spots</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Breakdown by tier */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Breakdown by Tier</CardTitle>
              </CardHeader>
              <CardContent>
                {data.by_tier.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No signups yet.</p>
                ) : (
                  <div className="space-y-2">
                    {data.by_tier.map((row) => (
                      <div
                        key={row.tier}
                        className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
                      >
                        <span className="text-muted-foreground">
                          {TIER_LABELS[row.tier] ?? `Tier ${row.tier}`}
                        </span>
                        <span className="font-medium">{row.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent signups */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No signups yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b border-border">
                          <th className="pb-2 font-medium">Email</th>
                          <th className="pb-2 font-medium">Tier</th>
                          <th className="pb-2 font-medium">Paid</th>
                          <th className="pb-2 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent.map((row, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="py-2 pr-4">{row.email}</td>
                            <td className="py-2 pr-4">{row.tier}</td>
                            <td className="py-2 pr-4">
                              ${(row.price_paid / 100).toFixed(2)}
                            </td>
                            <td className="py-2 text-muted-foreground text-xs">
                              {new Date(row.signed_up_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
