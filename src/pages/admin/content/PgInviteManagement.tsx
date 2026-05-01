import { useState, useEffect } from "react";
import { Copy, Download, RefreshCw, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GeneratedResult {
  email: string;
  token: string;
  link: string;
}

interface InviteRow {
  id: number;
  token: string;
  email: string;
  created_at: string;
  activated_at: string | null;
  activated: number;
}

const PgInviteManagement = () => {
  const [emailInput, setEmailInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  const [tokens, setTokens] = useState<InviteRow[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadTokens = async () => {
    setLoadingTokens(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/pg-invites", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { ok: boolean; tokens: InviteRow[] };
      if (data.ok) setTokens(data.tokens ?? []);
    } catch {
      setLoadError("Failed to load tokens.");
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => { loadTokens(); }, []);

  const handleGenerate = async () => {
    const emails = emailInput
      .split("\n")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      setGenerateError("Please enter at least one email address.");
      return;
    }

    setGenerating(true);
    setGenerateError("");
    setResults([]);

    try {
      const res = await fetch("/api/admin/pg-invites/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json() as { ok: boolean; results?: GeneratedResult[]; error?: string };
      if (!data.ok) {
        setGenerateError(data.error ?? "Generation failed.");
        return;
      }
      setResults(data.results ?? []);
      // Reload token status table
      await loadTokens();
    } catch {
      setGenerateError("Request failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (link: string, key: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 1500);
    } catch { /* silent */ }
  };

  const handleDownloadCsv = () => {
    const header = "email,invite_link";
    const rows = results.map((r) => `${r.email},${r.link}`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pg-invite-links.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <PageHeader title="Invite Links" description="Generate and manage prompt generator invite tokens." />

        {/* Section 1 — Generate */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Invite Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                One email address per line
              </label>
              <textarea
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                rows={6}
                placeholder={"alice@example.com\nbob@example.com"}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ring resize-y"
              />
            </div>

            {generateError && (
              <p className="text-sm text-destructive">{generateError}</p>
            )}

            <Button onClick={handleGenerate} disabled={generating}>
              {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Tokens
            </Button>

            {results.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {results.length} token{results.length !== 1 ? "s" : ""} generated
                  </p>
                  <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download CSV
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-4 py-2.5 text-left font-medium">Email</th>
                        <th className="px-4 py-2.5 text-left font-medium">Invite Link</th>
                        <th className="px-4 py-2.5 text-left font-medium w-16">Copy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r.email} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-mono text-xs">{r.email}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground max-w-xs truncate">
                            {r.link}
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              type="button"
                              onClick={() => handleCopy(r.link, r.email)}
                              className="p-1.5 rounded hover:bg-muted transition-colors"
                              title="Copy link"
                            >
                              <Copy
                                className="h-3.5 w-3.5"
                                style={{ color: copied[r.email] ? "#22c55e" : undefined }}
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2 — Token status table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Token Status</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadTokens} disabled={loadingTokens}>
              <RefreshCw className={`h-4 w-4 ${loadingTokens ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {loadError && <p className="text-sm text-destructive mb-3">{loadError}</p>}
            {loadingTokens ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No invite tokens yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-2.5 text-left font-medium">Email</th>
                      <th className="px-4 py-2.5 text-left font-medium">Link (truncated)</th>
                      <th className="px-4 py-2.5 text-left font-medium">Created</th>
                      <th className="px-4 py-2.5 text-left font-medium">Activated</th>
                      <th className="px-4 py-2.5 text-left font-medium">Activated At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((row) => {
                      const link = `https://provenai.app/api/pg-invite/${row.token}`;
                      const truncatedLink = `…/api/pg-invite/${row.token.slice(0, 8)}…`;
                      const createdDate = new Date(row.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                      const activatedDate = row.activated_at
                        ? new Date(row.activated_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—";

                      return (
                        <tr key={row.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-mono text-xs">{row.email}</td>
                          <td
                            className="px-4 py-2.5 font-mono text-xs text-muted-foreground cursor-pointer"
                            title={link}
                            onClick={() => handleCopy(link, `tbl-${row.id}`)}
                          >
                            {copied[`tbl-${row.id}`] ? "Copied!" : truncatedLink}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">{createdDate}</td>
                          <td className="px-4 py-2.5 text-xs">
                            {row.activated ? (
                              <span className="text-green-600 font-medium">Yes</span>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">{activatedDate}</td>
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
    </AppLayout>
  );
};

export default PgInviteManagement;
