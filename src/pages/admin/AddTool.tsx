import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Category,
  IntentTag,
  PricingModel,
  Platform,
  SkillLevel,
  categoryInfo,
  intentInfo,
  pricingInfo,
  platformInfo,
  skillLevelInfo,
  getAllCategories,
  getAllIntentTags,
} from "@/data/directoryToolsData";
import { useTools } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { Check, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/** Converts a display name into a lowercase kebab-case id slug */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PRICING_OPTIONS: PricingModel[] = ["free", "freemium", "paid", "enterprise"];
const PLATFORM_OPTIONS: Platform[] = ["web", "ios", "android", "desktop", "extension"];
const SKILL_OPTIONS: SkillLevel[] = ["beginner", "intermediate", "advanced"];

const EMPTY_FORM = {
  name: "",
  officialUrl: "",
  bestFor: "",
  notes: "",
  primaryCategory: "" as Category | "",
  secondaryCategories: [] as Category[],
  intentTags: [] as IntentTag[],
  platforms: ["web"] as Platform[],
  pricingModel: "freemium" as PricingModel,
  skillLevel: "beginner" as SkillLevel,
};

const AddTool = () => {
  const { toast } = useToast();
  const { addTool } = useTools();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = getAllCategories();
  const intents = getAllIntentTags();

  function toggleArray<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.officialUrl || !formData.primaryCategory) {
      toast({
        title: "Missing fields",
        description: "Name, URL and primary category are required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.intentTags.length === 0) {
      toast({
        title: "Missing intent",
        description: "Please select at least one intent tag.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const id = toSlug(formData.name);

    try {
      const res = await fetch("/api/admin/tools", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: formData.name,
          officialUrl: formData.officialUrl,
          bestFor: formData.bestFor,
          notes: formData.notes,
          primaryCategory: formData.primaryCategory,
          secondaryCategories: formData.secondaryCategories,
          intentTags: formData.intentTags,
          platforms: formData.platforms,
          pricingModel: formData.pricingModel,
          skillLevel: formData.skillLevel,
        }),
      });

      const data = await res.json() as { success: boolean; error?: string };

      if (!data.success) {
        toast({
          title: "Save failed",
          description: data.error ?? "Unknown error",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Tool added!",
        description: `${formData.name} saved as Unreviewed. Find it in the Review Queue.`,
      });

      // Optimistically add to live tools state so directory/jeffs-picks search updates immediately
      addTool({
        id,
        name: formData.name,
        officialUrl: formData.officialUrl,
        bestFor: formData.bestFor,
        primaryCategory: formData.primaryCategory as Category,
        secondaryCategories: formData.secondaryCategories,
        intentTags: formData.intentTags,
        platforms: formData.platforms,
        pricingModel: formData.pricingModel,
        skillLevel: formData.skillLevel,
        trustLevel: "unreviewed",
        lastReviewed: new Date().toISOString().slice(0, 10),
        notes: formData.notes,
      });

      setFormData(EMPTY_FORM);
    } catch {
      toast({
        title: "Network error",
        description: "Could not reach the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Add Tool"
        description="Add a new tool to the directory. It will appear as Unreviewed until promoted via the Review Queue."
      />

      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

        {/* ── Name + URL ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Tool name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., AetherWave Studio"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-12"
            />
          </div>
          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              Official URL <span className="text-destructive">*</span>
            </label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={formData.officialUrl}
              onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
              className="h-12"
            />
          </div>
        </div>

        {/* ── Best For ────────────────────────────────────────────────────── */}
        <div>
          <label htmlFor="bestFor" className="block text-sm font-medium mb-2">
            Best for <span className="text-muted-foreground text-xs font-normal">(one-line description shown on cards)</span>
          </label>
          <Input
            id="bestFor"
            type="text"
            placeholder="e.g., Generating royalty-free music with AI"
            value={formData.bestFor}
            onChange={(e) => setFormData({ ...formData, bestFor: e.target.value })}
            className="h-12"
          />
        </div>

        {/* ── Pricing + Skill ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Pricing model</label>
            <div className="flex flex-wrap gap-2">
              {PRICING_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, pricingModel: p })}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                    formData.pricingModel === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {pricingInfo[p].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Skill level</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({ ...formData, skillLevel: s })}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                    formData.skillLevel === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {skillLevelInfo[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Primary Category ────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Primary category <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    primaryCategory: category,
                    // Remove from secondaryCategories if it was there
                    secondaryCategories: formData.secondaryCategories.filter((c) => c !== category),
                  })
                }
                className={cn(
                  "p-3 text-left rounded-lg border transition-colors touch-manipulation",
                  formData.primaryCategory === category
                    ? "bg-primary/10 border-primary text-foreground"
                    : "bg-card border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{categoryInfo[category].label}</span>
                  {formData.primaryCategory === category && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Secondary Categories ────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Also appears in <span className="text-muted-foreground text-xs font-normal">(optional, select any additional categories)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((c) => c !== formData.primaryCategory)
              .map((category) => {
                const selected = formData.secondaryCategories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        secondaryCategories: toggleArray(formData.secondaryCategories, category),
                      })
                    }
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full border transition-colors touch-manipulation",
                      selected
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-card border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {selected && <Check className="inline h-3 w-3 mr-1 text-primary" />}
                    {categoryInfo[category].label}
                  </button>
                );
              })}
          </div>
        </div>

        {/* ── Intent Tags ─────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Intent tags <span className="text-destructive">*</span>{" "}
            <span className="text-muted-foreground text-xs font-normal">(select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {intents.map((intent) => {
              const selected = formData.intentTags.includes(intent);
              return (
                <button
                  key={intent}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      intentTags: toggleArray(formData.intentTags, intent),
                    })
                  }
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors touch-manipulation border",
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {intentInfo[intent].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Platforms ───────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium mb-2">Platforms available on</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((platform) => {
              const selected = formData.platforms.includes(platform);
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      platforms: toggleArray(formData.platforms, platform),
                    })
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors touch-manipulation",
                    selected
                      ? "bg-primary/10 border-primary text-foreground"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {platformInfo[platform].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Notes ───────────────────────────────────────────────────────── */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            Notes <span className="text-muted-foreground text-xs font-normal">(optional, internal only)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Any notes about this tool..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        {/* ── Submit ───────────────────────────────────────────────────────── */}
        <div className="pt-2">
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Tool
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border max-w-2xl">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> New tools are saved as "Unreviewed" and appear immediately in the
          directory and Jeff's Picks search. Use the{" "}
          <a href="/admin/tools/review-queue" className="underline">Review Queue</a> to promote them.
        </p>
      </div>
    </AppLayout>
  );
};

export default AddTool;
