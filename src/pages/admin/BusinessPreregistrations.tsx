import { useState, useEffect, useCallback } from "react";
import { BookOpen, Users, Loader2, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Registration {
  id: number;
  email: string;
  created_at: string;
}

const BusinessPreregistrations = () => {
  const [total, setTotal] = useState(0);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch("/api/admin/business-preregistrations", {
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        registrations?: Registration[];
        total?: number;
      };
      if (data.ok) {
        setRegistrations(data.registrations ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      // leave current state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (iso: string) => {
    const d = new Date(iso + "Z");
    return (
      d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <AppLayout>
      <PageHeader
        icon={BookOpen}
        title="Business Pre-registrations"
        description="Emails collected for the Business Founding Member tier."
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Pre-registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{total}</div>
            </CardContent>
          </Card>
        </div>

        {/* Table card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">All Registrations</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => load(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : registrations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No pre-registrations yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">#</th>
                      <th className="pb-3 font-medium text-muted-foreground">Email</th>
                      <th className="pb-3 font-medium text-muted-foreground">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg, idx) => (
                      <tr key={reg.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="py-3 pr-4">{reg.email}</td>
                        <td className="py-3 text-muted-foreground">
                          {formatDate(reg.created_at)}
                        </td>
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

export default BusinessPreregistrations;
