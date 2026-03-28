import { useState, useEffect, useCallback } from "react";
import { Plug, Mail, Eye, EyeOff, Save, Loader2, CheckCircle2, KeyRound, ChevronDown, ChevronRight, Link2, Bot, Lock, Unlock } from "lucide-react";
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

const SAASDESK_KEYS = {
  url: "saasdesk_webhook_url",
  key: "saasdesk_api_key",
} as const;

type PgModel = "claude" | "groq" | "gemini";

interface PgModelState {
  enabled: string;
  api_key: string;
  model: string;
  free_daily_limit: string;
  paid_daily_limit: string;
}

const PG_MODELS: PgModel[] = ["claude", "groq", "gemini"];

const PG_MODEL_LABELS: Record<PgModel, { name: string; description: string }> = {
  claude: { name: "Claude (Anthropic)", description: "Most powerful — paid members only" },
  groq:   { name: "Groq",              description: "Fast inference via Groq API" },
  gemini: { name: "Gemini (Google)",   description: "Google AI — fast and capable" },
};

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

  /* ── SaaSDesk integration state ── */
  const [sdFields, setSdFields] = useState({ url: "", key: "" });
  const [sdSaved, setSdSaved] = useState({ url: "", key: "" });
  const [showSdKey, setShowSdKey] = useState(false);
  const [sdLoading, setSdLoading] = useState(true);
  const [sdSaving, setSdSaving] = useState(false);

  /* ── Prompt Generator state ── */
  const defaultPgModel = (): PgModelState => ({
    enabled: "true",
    api_key: "",
    model: "",
    free_daily_limit: "0",
    paid_daily_limit: "10",
  });
  const [pgModels, setPgModels] = useState<Record<PgModel, PgModelState>>({
    claude: defaultPgModel(),
    groq:   defaultPgModel(),
    gemini: defaultPgModel(),
  });
  const [pgSaved, setPgSaved] = useState<Record<PgModel, PgModelState>>({
    claude: defaultPgModel(),
    groq:   defaultPgModel(),
    gemini: defaultPgModel(),
  });
  const [pgLoading, setPgLoading] = useState(true);
  const [pgSaving, setPgSaving] = useState<PgModel | null>(null);
  const [pgShowKey, setPgShowKey] = useState<Record<PgModel, boolean>>({
    claude: false, groq: false, gemini: false,
  });

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
        if (loaded.group || loaded.tagAi || loaded.tagPai) {
          setShowAdvanced(true);
        }

        // SaaSDesk fields
        const sdLoaded = {
          url: s[SAASDESK_KEYS.url] || "",
          key: s[SAASDESK_KEYS.key] || "",
        };
        setSdFields(sdLoaded);
        setSdSaved(sdLoaded);
      }
    } catch {
      // leave defaults
    } finally {
      setEmailLoading(false);
      setSdLoading(false);
    }

    // Load PG settings separately
    setPgLoading(true);
    try {
      const pgRes = await fetch("/api/admin/prompt-generator/settings", { credentials: "include" });
      const pgData = await pgRes.json() as { success?: boolean; settings?: Record<string, string> };
      if (pgData.success && pgData.settings) {
        const s = pgData.settings;
        const build = (m: PgModel): PgModelState => ({
          enabled:          s[`pg_${m}_enabled`]          ?? "true",
          api_key:          s[`pg_${m}_api_key`]          ?? "",
          model:            s[`pg_${m}_model`]            ?? "",
          free_daily_limit: s[`pg_${m}_free_daily_limit`] ?? "0",
          paid_daily_limit: s[`pg_${m}_paid_daily_limit`] ?? "10",
        });
        const loaded = {
          claude: build("claude"),
          groq:   build("groq"),
          gemini: build("gemini"),
        };
        setPgModels(loaded);
        setPgSaved(loaded);
      }
    } catch {
      // leave defaults
    } finally {
      setPgLoading(false);
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

  /* ── SaaSDesk save ── */
  const handleSdSave = async () => {
    setSdSaving(true);
    try {
      const entries: [string, string][] = [
        [SAASDESK_KEYS.url, sdFields.url.trim()],
        [SAASDESK_KEYS.key, sdFields.key.trim()],
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
      setSdSaved({ ...sdFields });
      toast({ title: "Saved", description: "SaaSDesk integration settings updated" });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSdSaving(false);
    }
  };

  const sdHasChanges = sdFields.url !== sdSaved.url || sdFields.key !== sdSaved.key;
  const sdIsConnected = sdSaved.url.length > 0 && sdSaved.key.length > 0;

  /* ── PG save ── */
  const handlePgSave = async (model: PgModel) => {
    setPgSaving(model);
    try {
      const fields = pgModels[model];
      const entries: [string, string][] = [
        [`pg_${model}_enabled`,          fields.enabled],
        [`pg_${model}_api_key`,          fields.api_key.trim()],
        [`pg_${model}_model`,            fields.model.trim()],
        [`pg_${model}_free_daily_limit`, fields.free_daily_limit],
        [`pg_${model}_paid_daily_limit`, fields.paid_daily_limit],
      ];
      for (const [key, value] of entries) {
        const res = await fetch("/api/admin/prompt-generator/settings", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!res.ok) throw new Error(`Failed to save ${key}`);
      }
      setPgSaved(prev => ({ ...prev, [model]: { ...fields } }));
      toast({ title: "Saved", description: `${PG_MODEL_LABELS[model].name} settings updated` });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setPgSaving(null);
    }
  };

  const pgHasChanges = (model: PgModel) => {
    const cur = pgModels[model];
    const sav = pgSaved[model];
    return (
      cur.enabled          !== sav.enabled ||
      cur.api_key          !== sav.api_key ||
      cur.model            !== sav.model   ||
      cur.free_daily_limit !== sav.free_daily_limit ||
      cur.paid_daily_limit !== sav.paid_daily_limit
    );
  };

  const updatePg = (model: PgModel, field: keyof PgModelState, value: string) =>
    setPgModels(prev => ({ ...prev, [model]: { ...prev[model], [field]: value } }));

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

        {/* ─── SaaSDesk CRM ─── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">SaaSDesk</CardTitle>
                  <CardDescription>Forward book signups to saasdesk.dev</CardDescription>
                </div>
              </div>
              {!sdLoading && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    sdIsConnected
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${sdIsConnected ? "bg-emerald-500" : "bg-zinc-400"}`} />
                  {sdIsConnected ? "Connected" : "Not configured"}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {sdLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Book signups will be forwarded to your SaaSDesk webhook in real time. Generate an API key in SaaSDesk under Settings &gt; Integrations.
                </p>

                <Separator />

                {/* Webhook URL */}
                <div className="space-y-2">
                  <Label htmlFor="sd-url">Webhook URL</Label>
                  <Input
                    id="sd-url"
                    type="url"
                    placeholder="https://saasdesk.dev/api/webhooks/subscriber"
                    value={sdFields.url}
                    onChange={(e) => setSdFields({ ...sdFields, url: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor="sd-key" className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="sd-key"
                      type={showSdKey ? "text" : "password"}
                      placeholder="Paste your SaaSDesk API key"
                      value={sdFields.key}
                      onChange={(e) => setSdFields({ ...sdFields, key: e.target.value })}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSdKey(!showSdKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSdKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Button onClick={handleSdSave} disabled={!sdHasChanges || sdSaving}>
                    {sdSaving ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" />Save</>
                    )}
                  </Button>
                  {sdHasChanges && (
                    <span className="text-sm text-muted-foreground">Unsaved changes</span>
                  )}
                  {!sdHasChanges && sdIsConnected && (
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

        {/* ─── Prompt Generator — AI Models ─── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Prompt Generator — AI Models</CardTitle>
                <CardDescription>Configure the AI models available in the Prompt Generator tool.</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {pgLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                {PG_MODELS.map((model) => {
                  const isClaude = model === "claude";
                  const fields = pgModels[model];
                  const saved = pgSaved[model];
                  const hasChanges = pgHasChanges(model);
                  const isSaving = pgSaving === model;
                  const isConnected = saved.api_key.length > 0;

                  return (
                    <div key={model} className="rounded-lg border border-border p-4 space-y-4">
                      {/* Header row */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{PG_MODEL_LABELS[model].name}</p>
                          <p className="text-xs text-muted-foreground">{PG_MODEL_LABELS[model].description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!pgLoading && (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isConnected
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-zinc-400"}`} />
                              {isConnected ? "Key set" : "No key"}
                            </span>
                          )}
                          {/* Enabled toggle */}
                          <button
                            type="button"
                            onClick={() => updatePg(model, "enabled", fields.enabled === "true" ? "false" : "true")}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                              fields.enabled === "true"
                                ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20"
                                : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-300"
                            }`}
                          >
                            {fields.enabled === "true"
                              ? <><Unlock className="h-3 w-3" /> Enabled</>
                              : <><Lock className="h-3 w-3" /> Disabled</>
                            }
                          </button>
                        </div>
                      </div>

                      <Separator />

                      {/* API Key */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-sm">
                          <KeyRound className="h-3.5 w-3.5" />
                          API Key
                        </Label>
                        <div className="relative">
                          <Input
                            type={pgShowKey[model] ? "text" : "password"}
                            placeholder={`Paste your ${PG_MODEL_LABELS[model].name} API key`}
                            value={fields.api_key}
                            onChange={(e) => updatePg(model, "api_key", e.target.value)}
                            className="pr-10 font-mono text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setPgShowKey(prev => ({ ...prev, [model]: !prev[model] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {pgShowKey[model] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Model string */}
                      <div className="space-y-2">
                        <Label className="text-sm">Model</Label>
                        <Input
                          type="text"
                          placeholder="Model identifier"
                          value={fields.model}
                          onChange={(e) => updatePg(model, "model", e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>

                      {/* Daily limits */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Free subscriber daily limit</Label>
                          {isClaude ? (
                            <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-muted text-muted-foreground text-sm">
                              <Lock className="h-3.5 w-3.5" /> Members only
                            </div>
                          ) : (
                            <Input
                              type="number"
                              min="0"
                              value={fields.free_daily_limit}
                              onChange={(e) => updatePg(model, "free_daily_limit", e.target.value)}
                              className="text-sm"
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Paid member daily limit</Label>
                          <Input
                            type="number"
                            min="0"
                            value={fields.paid_daily_limit}
                            onChange={(e) => updatePg(model, "paid_daily_limit", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center gap-3">
                        <Button size="sm" onClick={() => handlePgSave(model)} disabled={!hasChanges || isSaving}>
                          {isSaving ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                          ) : (
                            <><Save className="h-4 w-4 mr-2" />Save</>
                          )}
                        </Button>
                        {hasChanges && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
                        {!hasChanges && isConnected && (
                          <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Credentials saved
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
