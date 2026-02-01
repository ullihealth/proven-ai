import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { DirectorySearch } from "@/components/directory/DirectorySearch";
import { DirectoryFilters, FilterState } from "@/components/directory/DirectoryFilters";
import { CategoryBrowse } from "@/components/directory/CategoryBrowse";
import { ToolCard } from "@/components/directory/ToolCard";
import { useTools } from "@/lib/tools";
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

      {/* Footer */}
      <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tools are assessed honestly — we highlight both strengths and limitations. 
          Core tools have deep write-ups. Tap any tool for details.
        </p>
      </div>
    </AppLayout>
  );
};

export default ToolsDirectory;
