import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { GuideCard, DiscoveryFilters } from "@/components/guides";
import { getDiscoveryGuides, getAllTags, SortOption } from "@/lib/guides";
import { GuideLifecycleState, GuideDifficulty } from "@/lib/guides/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

const GuidesDiscovery = () => {
  const [sort, setSort] = useState<SortOption>('latest');
  const [lifecycleFilter, setLifecycleFilter] = useState<GuideLifecycleState | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<GuideDifficulty | 'all'>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const availableTags = getAllTags();
  
  const guides = getDiscoveryGuides({
    sort,
    lifecycleFilter,
    difficultyFilter,
    tagFilter,
    searchQuery,
  });

  return (
    <AppLayout>
      <PageHeader
        title="Discover All Guides"
        description="Browse our complete library of guides. Filter by status, difficulty, or topic to find exactly what you need."
      />

      {/* Back to curated view */}
      <div className="mb-6">
        <Link to="/learn/guides">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to curated guides
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <DiscoveryFilters
        sort={sort}
        onSortChange={setSort}
        lifecycleFilter={lifecycleFilter}
        onLifecycleChange={setLifecycleFilter}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={setDifficultyFilter}
        tagFilter={tagFilter}
        onTagChange={setTagFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        availableTags={availableTags}
      />

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {guides.length} {guides.length === 1 ? 'guide' : 'guides'} found
        </p>
      </div>

      {/* Guides grid */}
      {guides.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {guides.map(guide => (
            <GuideCard 
              key={guide.id} 
              guide={guide} 
              variant="discovery" 
              showThumbnail={!!guide.thumbnailUrl}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-medium text-foreground">No guides found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search query.
          </p>
        </div>
      )}
    </AppLayout>
  );
};

export default GuidesDiscovery;
