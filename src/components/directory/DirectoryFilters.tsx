import { useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { 
  PricingModel, 
  Platform, 
  SkillLevel, 
  TrustLevel,
  pricingInfo,
  platformInfo,
  skillLevelInfo,
  trustLevelInfo 
} from "@/data/directoryToolsData";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface FilterState {
  pricing: PricingModel[];
  platforms: Platform[];
  skillLevel: SkillLevel[];
  trustLevel: TrustLevel[];
  sortBy: 'useful' | 'recent' | 'az';
}

interface DirectoryFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const DirectoryFilters = ({ filters, onFiltersChange }: DirectoryFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const activeFilterCount = 
    filters.pricing.length + 
    filters.platforms.length + 
    filters.skillLevel.length + 
    filters.trustLevel.length;

  const toggleFilter = <T extends string>(
    key: keyof Omit<FilterState, 'sortBy'>,
    value: T
  ) => {
    const current = filters[key] as T[];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const setSortBy = (sortBy: FilterState['sortBy']) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      pricing: [],
      platforms: [],
      skillLevel: [],
      trustLevel: [],
      sortBy: 'useful',
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-lg touch-manipulation">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-3 p-4 bg-card border border-border rounded-lg space-y-4">
          {/* Pricing */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Pricing</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(pricingInfo) as PricingModel[]).map(pricing => (
                <button
                  key={pricing}
                  onClick={() => toggleFilter('pricing', pricing)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-md transition-colors touch-manipulation",
                    filters.pricing.includes(pricing)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {pricingInfo[pricing].label}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Platform</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(platformInfo) as Platform[]).map(platform => (
                <button
                  key={platform}
                  onClick={() => toggleFilter('platforms', platform)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-md transition-colors touch-manipulation",
                    filters.platforms.includes(platform)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {platformInfo[platform].label}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Level */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Skill Level</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(skillLevelInfo) as SkillLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => toggleFilter('skillLevel', level)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-md transition-colors touch-manipulation",
                    filters.skillLevel.includes(level)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {skillLevelInfo[level].label}
                </button>
              ))}
            </div>
          </div>

          {/* Trust Level */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Trust Level</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(trustLevelInfo) as TrustLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => toggleFilter('trustLevel', level)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-md transition-colors touch-manipulation",
                    filters.trustLevel.includes(level)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {trustLevelInfo[level].label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Sort by</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSortBy('useful')}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-colors touch-manipulation",
                  filters.sortBy === 'useful'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                Most useful
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-colors touch-manipulation",
                  filters.sortBy === 'recent'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                Recently reviewed
              </button>
              <button
                onClick={() => setSortBy('az')}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-colors touch-manipulation",
                  filters.sortBy === 'az'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                A–Z
              </button>
            </div>
          </div>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="w-full py-2 text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
