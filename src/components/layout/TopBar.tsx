import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const TopBar = () => {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-sidebar-border bg-pai-topbar backdrop-blur supports-[backdrop-filter]:bg-pai-topbar/95">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="What do you want to find right now?"
              className="pl-10 h-10 bg-background border-sidebar-border focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Right side - could add notifications, settings, etc. */}
        <div className="flex items-center gap-4 ml-6">
          <span className="text-sm text-muted-foreground">
            Welcome back
          </span>
        </div>
      </div>
    </header>
  );
};
