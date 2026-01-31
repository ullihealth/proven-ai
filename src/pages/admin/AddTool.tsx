import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Category, 
  IntentTag, 
  categoryInfo, 
  intentInfo,
  getAllCategories,
  getAllIntentTags 
} from "@/data/directoryToolsData";
import { cn } from "@/lib/utils";
import { Check, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AddTool = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    officialUrl: "",
    primaryCategory: "" as Category | "",
    intentTag: "" as IntentTag | "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = getAllCategories();
  const intents = getAllIntentTags();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.officialUrl || !formData.primaryCategory || !formData.intentTag) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission - in production this would save to database
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Tool captured!",
      description: `${formData.name} has been added as Unreviewed.`,
    });

    // Reset form
    setFormData({
      name: "",
      officialUrl: "",
      primaryCategory: "",
      intentTag: "",
    });
    
    setIsSubmitting(false);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Add Tool (Quick Capture)"
        description="Capture a new tool for the directory. It will be marked as Unreviewed."
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Tool name <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., Perplexity"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-12"
          />
        </div>

        {/* Official URL */}
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

        {/* Primary Category */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Primary category <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => setFormData({ ...formData, primaryCategory: category })}
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

        {/* Intent Tag */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Primary intent <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {intents.map(intent => (
              <button
                key={intent}
                type="button"
                onClick={() => setFormData({ ...formData, intentTag: intent })}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors touch-manipulation",
                  formData.intentTag === intent
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {intentInfo[intent].label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Saving..."
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Tool
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Info note */}
      <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> New tools are added as "Unreviewed" by default. 
          Use the Review Queue to assess and promote tools.
        </p>
      </div>
    </AppLayout>
  );
};

export default AddTool;
