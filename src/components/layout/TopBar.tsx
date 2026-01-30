import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const TopBar = () => {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[hsl(222,40%,18%)] bg-[hsl(222,47%,11%)]">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(215,16%,65%)]" />
            <Input
              type="search"
              placeholder="What do you want to find right now?"
              className="pl-10 h-10 bg-[hsl(222,40%,15%)] border-[hsl(222,35%,25%)] text-white placeholder:text-[hsl(215,16%,55%)] focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 ml-6">
          <span className="text-sm text-[hsl(215,20%,82%)]">
            Welcome back
          </span>
        </div>
      </div>
    </header>
  );
};
