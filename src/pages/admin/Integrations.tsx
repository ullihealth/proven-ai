import { useState, useEffect, useCallback } from "react";
import { Plug, Mail, Eye, EyeOff, Save, Loader2, CheckCircle2, KeyRound, ChevronDown, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

/* ─── Settings keys stored in site_settings ─── */
const EMAIL_KEYS = {
  token:   "sender_api_token",
  group:   "sender_group_id",
  tagAi:   "sender_tag_ai_group",
  tagPai:  "sender_tag_proven_ai",
} as const;

const Integrations = () => {
  const { toast } = useToast();

  /* ── Email integration state ── */
  const [emailFields, setEmailFields] = useState({
    token: "",
    group: "",
    tagAi: "",
    tagPai: "",
  });
  const [savedFields, setSavedFields] = useState({ ...emailFields });
  const [showToken, setShowToken] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [emailLoading, setEmailLoading] = useState(true);
  const [emailSaving, setEmailSaving] = useState(false);

  /* ── Load current values ── */
  const loadEmailSettings = useCallback(async () => {
    setEmailLoading(true);
    try {
      const res = await fetch("/api/admin/site-settings", { credentials: "include" });
      const data = await res.json() as { success?: boolean; settings?: Record<string, string> };
      if (data.success && data.settings) {
        const s = data.settings;
        const loaded = {
          token: s[EMAIL_KEYS.token] || "",
          group: s[EMAIL_KEYS.group] || "",
          tagAi: s[EMAIL_KEYS.tagAi] || "",
          tagPai: s[EMAIL_KEYS.tagPai] || "",
        };
        setEmailFields(loaded);
        setSavedFields(loaded);
        // Auto-expand advanced if any routing values exist
        if (loaded.group || loaded.tagAi || loaded.tagPai) {
          setShowAdvanced(true);
        }
      }
    } catch {
      // leave defaults
    } finally {
      setEmailLoading(false);
    }
  }, []);

  useEffect(() => { loadEmailSettings(); }, [loadEmailSettings]);

  /* ── Save handler ── */
  const handleEmailSave = async () => {
    setEmailSaving(true);
    try {
      const entries: [string, string][] = [
        [EMAIL_KEYS.token, emailFields.token.trim()],
        [EMAIL_KEYS.group, emailFields.group.trim()],
        [EMAIL_KEYS.tagAi, emailFields.tagAi.trim()],
        [EMAIL_KEYS.tagPai, emailFields.tagPai.trim()],
      ];

      for (const [key, value] of entries) {
        const res = await fetch("/api/admin/site-settings", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!res.ok) throw new Error(`Failed to save ${key}`);
      }

      setSavedFields({ ...emailFields });
      toast({ title: "Saved", description: "Email integration settings updated" });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setEmailSaving(false);
    }
  };

  const emailHasChanges =
    emailFields.token !== savedFields.token ||
    emailFields.group !== savedFields.group ||
    emailFields.tagAi !== savedFields.tagAi ||
    emailFields.tagPai !== savedFields.tagPai;

  const emailIsConnected = savedFields.token.length > 0;

  return (
    <AppLayout>
      <PageHeader title="Integrations & APIs" description="Connect external services and manage API credentials." />

      <div className="space-y-8 max-w-2xl">
        {/* ─── Email / Sender.net ─── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Email</CardTitle>
                  <CardDescription>Sender.net API</CardDescription>
                </div>
              </div>
              {!emailLoading && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    emailIsConnected
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      emailIsConnected ? "bg-emerald-500" : "bg-zinc-400"
                    }`}
                  />
                  {emailIsConnected ? "Connected" : "Not configured"}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {emailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Paste your API token from Sender.net &gt; Settings &gt; API access tokens. It is stored securely and never exposed to the browser.
                </p>

                <Separator />

                {/* API Token — primary field */}
                <div className="space-y-2">
                  <Label htmlFor="sender-token" className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    API Token
                  </Label>
                  <div className="relative">
                    <Input
                      id="sender-token"
                      type={showToken ? "text" : "password"}
                      placeholder="Paste your Sender.net API token"
                      value={emailFields.token}
                      onChange={(e) => setEmailFields({ ...emailFields, token: e.target.value })}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Advanced: Group + Tags — collapsible */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAdvanced ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    Subscriber routing (optional)
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-4 pl-5 border-l-2 border-border">
                      <p className="text-xs text-muted-foreground">
                        These control which group and tags new subscribers are assigned in Sender.net. Find them under Subscribers &gt; Groups and Subscribers &gt; Tags.
                      </p>

                      {/* Group ID */}
                      <div className="space-y-1.5">
                        <Label htmlFor="sender-group" className="text-sm">Subscriber Group ID</Label>
                        <Input
                          id="sender-group"
                          type="text"
                          placeholder="e.g. eqQnl7"
                          value={emailFields.group}
                          onChange={(e) => setEmailFields({ ...emailFields, group: e.target.value })}
                          className="font-mono text-sm"
                        />
                      </div>

                      {/* Tags */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="sender-tag-ai" className="text-sm">Tag: AI Community</Label>
                          <Input
                            id="sender-tag-ai"
                            type="text"
                            placeholder="Tag ID"
                            value={emailFields.tagAi}
                            onChange={(e) => setEmailFields({ ...emailFields, tagAi: e.target.value })}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="sender-tag-pai" className="text-sm">Tag: Proven AI</Label>
                          <Input
                            id="sender-tag-pai"
                            type="text"
                            placeholder="Tag ID"
                            value={emailFields.tagPai}
                            onChange={(e) => setEmailFields({ ...emailFields, tagPai: e.target.value })}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Save */}
                <div className="flex items-center gap-3">
                  <Button onClick={handleEmailSave} disabled={!emailHasChanges || emailSaving}>
                    {emailSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                  {emailHasChanges && (
                    <span className="text-sm text-muted-foreground">Unsaved changes</span>
                  )}
                  {!emailHasChanges && emailIsConnected && (
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Credentials saved
                    </span>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ─── Future integrations placeholder ─── */}
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-4 py-8">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <Plug className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">More integrations coming soon</p>
              <p className="text-sm text-muted-foreground">
                Payment processors, analytics services, and other API connections will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Integrations;
