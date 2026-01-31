import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { IntentTag, intentInfo, getAllIntentTags } from "@/data/directoryToolsData";
import { cn } from "@/lib/utils";

interface DirectorySearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeIntent: IntentTag | null;
  onIntentChange: (intent: IntentTag | null) => void;
}

export const DirectorySearch = ({
  searchQuery,
  onSearchChange,
  activeIntent,
  onIntentChange,
}: DirectorySearchProps) => {
  const intents = getAllIntentTags();

  return (
    <div className="sticky top-0 z-10 -mx-4 px-4 md:-mx-6 md:px-6 pt-1 pb-4 bg-background border-b border-border shadow-sm">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 h-12 text-base bg-card border-border"
        />
      </div>
      
      {/* Intent chips - "What do you want to do?" */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <p className="text-xs text-muted-foreground mb-2 font-medium">
          What do you want to do?
        </p>
        <div className="flex gap-2 min-w-max pb-1">
          <button
            onClick={() => onIntentChange(null)}
            className={cn(
              "px-3 h-9 rounded-full text-sm font-medium transition-colors touch-manipulation whitespace-nowrap",
              activeIntent === null
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {intents.map((intent) => (
            <button
              key={intent}
              onClick={() => onIntentChange(intent === activeIntent ? null : intent)}
              className={cn(
                "px-3 h-9 rounded-full text-sm font-medium transition-colors touch-manipulation whitespace-nowrap",
                activeIntent === intent
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {intentInfo[intent].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
