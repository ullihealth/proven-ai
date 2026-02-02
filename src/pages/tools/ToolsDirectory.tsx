import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { DirectorySearch } from "@/components/directory/DirectorySearch";
import { DirectoryFilters, FilterState } from "@/components/directory/DirectoryFilters";
import { CategoryBrowse } from "@/components/directory/CategoryBrowse";
import { ToolCard } from "@/components/directory/ToolCard";
import { useTools, getDirectoryCardSettings, hslToCss } from "@/lib/tools";
import { ArrowLeft, Sparkles } from "lucide-react";
import { 
  IntentTag, 
  Category,
  TrustLevel,
} from "@/data/directoryToolsData";

const trustLevelOrder: Record<TrustLevel, number> = {
  core: 0,
  recommended: 1,
  reviewed: 2,
  unreviewed: 3,
  archived: 4,
};

const ToolsDirectory = () => {
  const { tools } = useTools();
  const settings = useMemo(() => getDirectoryCardSettings(), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIntent, setActiveIntent] = useState<IntentTag | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    pricing: [],
    platforms: [],
    skillLevel: [],
    trustLevel: [],
    sortBy: 'useful',
  });

  const filteredTools = useMemo(() => {
    let result = [...tools];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.bestFor.toLowerCase().includes(query) ||
        tool.notes?.toLowerCase().includes(query)
      );
    }

    // Intent filter
    if (activeIntent) {
      result = result.filter(tool => tool.intentTags.includes(activeIntent));
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(tool =>
        tool.primaryCategory === selectedCategory ||
        tool.secondaryCategories?.includes(selectedCategory)
      );
    }

    // Pricing filter
    if (filters.pricing.length > 0) {
      result = result.filter(tool => filters.pricing.includes(tool.pricingModel));
    }

    // Platform filter
    if (filters.platforms.length > 0) {
      result = result.filter(tool =>
        tool.platforms.some(p => filters.platforms.includes(p))
      );
    }

    // Skill level filter
    if (filters.skillLevel.length > 0) {
      result = result.filter(tool => filters.skillLevel.includes(tool.skillLevel));
    }

    // Trust level filter
    if (filters.trustLevel.length > 0) {
      result = result.filter(tool => filters.trustLevel.includes(tool.trustLevel));
    }

    // Sorting
    switch (filters.sortBy) {
      case 'useful':
        // Sort by trust level (core first, then recommended, etc.)
        result.sort((a, b) => trustLevelOrder[a.trustLevel] - trustLevelOrder[b.trustLevel]);
        break;
      case 'recent':
        // Sort by last reviewed (newest first) - simple string comparison works for "Month Year" format
        result.sort((a, b) => b.lastReviewed.localeCompare(a.lastReviewed));
        break;
      case 'az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [tools, searchQuery, activeIntent, selectedCategory, filters]);

  const handleIntentChange = (intent: IntentTag | null) => {
    setActiveIntent(intent);
    // Clear category when intent changes to avoid confusion
    if (intent) {
      setSelectedCategory(null);
    }
  };

  const handleCategoryChange = (category: Category | null) => {
    setSelectedCategory(category);
    // Clear intent when category changes
    if (category) {
      setActiveIntent(null);
    }
  };

  return (
    <AppLayout>
      <div 
        className="-mx-4 -mt-4 px-4 pt-4 pb-8 min-h-full"
        style={{ backgroundColor: hslToCss(settings.pageBackground ?? "210 20% 98%") }}
      >
        {/* Link back to Core Tools */}
        <Link
          to="/core-tools"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 min-h-[44px] -ml-1 px-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Core Tools
        </Link>

        <PageHeader
          title="Tools Directory"
          description="Discover AI tools for any task. Honest assessments, no affiliate links."
        />

      {/* Layer 1: Discovery - Sticky search + intent chips */}
      <DirectorySearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeIntent={activeIntent}
        onIntentChange={handleIntentChange}
      />

      {/* Layer 1: Category browse + Layer 2: Filters */}
      <div className="mt-4 space-y-3">
        <CategoryBrowse
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
        
        <DirectoryFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Results count */}
      <div className="mt-6 mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found
        </p>
        {(searchQuery || activeIntent || selectedCategory || filters.pricing.length > 0 || filters.platforms.length > 0 || filters.skillLevel.length > 0 || filters.trustLevel.length > 0) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveIntent(null);
              setSelectedCategory(null);
              setFilters({
                pricing: [],
                platforms: [],
                skillLevel: [],
                trustLevel: [],
                sortBy: 'useful',
              });
            }}
            className="text-sm text-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Tool cards - Layer 3 preview */}
      <div className="space-y-3">
        {filteredTools.length > 0 ? (
          filteredTools.map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))
        ) : (
          <div className="p-8 text-center bg-card rounded-xl border border-border">
            <p className="text-muted-foreground">No tools match your criteria.</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search.</p>
          </div>
        )}
      </div>

      {/* Footer with Core Tools CTA */}
      <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">New to AI tools?</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Start with our 5 curated Core Tools before exploring the full directory.
            </p>
          </div>
        </div>
        <Link
          to="/core-tools"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/30 text-sm font-medium text-foreground transition-colors"
        >
          View Core Tools
          <Sparkles className="h-3.5 w-3.5" />
        </Link>
      </div>
      </div>
    </AppLayout>
  );
};

export default ToolsDirectory;
