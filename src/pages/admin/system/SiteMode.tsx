import { useState, useEffect } from "react";
import { Globe, Save, Loader2 } from "lucide-react";
import { GovernanceHeader } from "@/components/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type SiteModeValue = "live" | "coming_soon";

const SiteMode = () => {
  const { toast } = useToast();
  const [currentMode, setCurrentMode] = useState<SiteModeValue | null>(null);
  const [selectedMode, setSelectedMode] = useState<SiteModeValue>("live");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current mode on mount
  useEffect(() => {
    fetch("/api/admin/site-settings?key=auth_mode", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { success?: boolean; value?: string }) => {
        const val = data.value === "coming_soon" ? "coming_soon" : "live";
        setCurrentMode(val);
        setSelectedMode(val);
      })
      .catch(() => {
        setCurrentMode("live");
        setSelectedMode("live");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "auth_mode", value: selectedMode }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        toast({ title: "Error", description: data.error || "Failed to save", variant: "destructive" });
        return;
      }
      setCurrentMode(selectedMode);
      toast({ title: "Saved", description: `Site mode set to ${selectedMode === "live" ? "Live" : "Coming Soon"}` });
    } catch {
      toast({ title: "Error", description: "Failed to save setting", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = currentMode !== selectedMode;

  return (
    <div className="space-y-6 max-w-2xl">
      <GovernanceHeader
        title="Site Mode"
        description="Control whether the auth page shows the normal sign-in form or a coming soon landing page."
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" />
              Auth Page Mode
            </CardTitle>
            <CardDescription>
              Choose what visitors see when they visit the sign-in page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status indicator */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Currently active:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentMode === "live"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    currentMode === "live" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {currentMode === "live" ? "Live" : "Coming Soon"}
              </span>
            </div>

            {/* Mode selector */}
            <div className="grid gap-3">
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedMode === "live"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <input
                  type="radio"
                  name="site-mode"
                  value="live"
                  checked={selectedMode === "live"}
                  onChange={() => setSelectedMode("live")}
                  className="mt-1 accent-primary"
                />
                <div>
                  <div className="font-medium text-foreground">Live</div>
                  <div className="text-sm text-muted-foreground">
                    Normal sign-in and sign-up forms are shown. Users can create accounts and log in.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedMode === "coming_soon"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <input
                  type="radio"
                  name="site-mode"
                  value="coming_soon"
                  checked={selectedMode === "coming_soon"}
                  onChange={() => setSelectedMode("coming_soon")}
                  className="mt-1 accent-primary"
                />
                <div>
                  <div className="font-medium text-foreground">Coming Soon</div>
                  <div className="text-sm text-muted-foreground">
                    Auth page shows a "Coming Soon" message with an email capture form. Sign-ups are saved to the waitlist.
                  </div>
                </div>
              </label>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={!hasChanges || saving}>
                {saving ? (
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
              {hasChanges && (
                <span className="text-sm text-muted-foreground">Unsaved changes</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SiteMode;
