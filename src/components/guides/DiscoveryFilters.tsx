import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { 
  GuideLifecycleState, 
  GuideDifficulty, 
  lifecycleStateLabels, 
  difficultyLabels 
} from "@/lib/guides/types";
import { SortOption } from "@/lib/guides/guidesStore";

interface DiscoveryFiltersProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  lifecycleFilter: GuideLifecycleState | 'all';
  onLifecycleChange: (lifecycle: GuideLifecycleState | 'all') => void;
  difficultyFilter: GuideDifficulty | 'all';
  onDifficultyChange: (difficulty: GuideDifficulty | 'all') => void;
  tagFilter: string;
  onTagChange: (tag: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableTags: string[];
}

export function DiscoveryFilters({
  sort,
  onSortChange,
  lifecycleFilter,
  onLifecycleChange,
  difficultyFilter,
  onDifficultyChange,
  tagFilter,
  onTagChange,
  searchQuery,
  onSearchChange,
  availableTags,
}: DiscoveryFiltersProps) {
  const hasActiveFilters = lifecycleFilter !== 'all' || difficultyFilter !== 'all' || tagFilter !== '' || searchQuery !== '';
  
  const clearAllFilters = () => {
    onLifecycleChange('all');
    onDifficultyChange('all');
    onTagChange('');
    onSearchChange('');
  };
  
  return (
    <div className="mb-6 space-y-4">
      {/* Search and sort row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search guides..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Sort */}
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="difficulty">By Difficulty</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Lifecycle filter */}
        <Select 
          value={lifecycleFilter} 
          onValueChange={(v) => onLifecycleChange(v as GuideLifecycleState | 'all')}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="current">{lifecycleStateLabels.current}</SelectItem>
            <SelectItem value="reference">{lifecycleStateLabels.reference}</SelectItem>
            <SelectItem value="legacy">{lifecycleStateLabels.legacy}</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Difficulty filter */}
        <Select 
          value={difficultyFilter} 
          onValueChange={(v) => onDifficultyChange(v as GuideDifficulty | 'all')}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">{difficultyLabels.beginner}</SelectItem>
            <SelectItem value="intermediate">{difficultyLabels.intermediate}</SelectItem>
            <SelectItem value="advanced">{difficultyLabels.advanced}</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Tag filter */}
        {availableTags.length > 0 && (
          <Select value={tagFilter || 'all'} onValueChange={(v) => onTagChange(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {availableTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {/* Clear filters */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
