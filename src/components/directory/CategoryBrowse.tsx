import { useState } from "react";
import { ChevronDown, ChevronUp, Grid3X3 } from "lucide-react";
import { Category, categoryInfo, getAllCategories, getToolsByCategory } from "@/data/directoryToolsData";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CategoryBrowseProps {
  selectedCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
}

export const CategoryBrowse = ({ selectedCategory, onCategoryChange }: CategoryBrowseProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const categories = getAllCategories();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-lg touch-manipulation">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Browse by category</span>
          {selectedCategory && (
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs">
              {categoryInfo[selectedCategory].label}
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
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* All category option */}
          <button
            onClick={() => onCategoryChange(null)}
            className={cn(
              "p-3 text-left rounded-lg border transition-colors touch-manipulation",
              selectedCategory === null
                ? "bg-primary/10 border-primary/30 text-foreground"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
            )}
          >
            <p className="font-medium text-sm">All Categories</p>
            <p className="text-xs mt-0.5 opacity-70">View all tools</p>
          </button>
          
          {categories.map(category => {
            const info = categoryInfo[category];
            const toolCount = getToolsByCategory(category).length;
            
            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category === selectedCategory ? null : category)}
                className={cn(
                  "p-3 text-left rounded-lg border transition-colors touch-manipulation",
                  selectedCategory === category
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{info.label}</p>
                  <span className="text-xs opacity-50">{toolCount}</span>
                </div>
                <p className="text-xs mt-0.5 opacity-70 line-clamp-1">{info.description}</p>
              </button>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
