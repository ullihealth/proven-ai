import { Search, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/auth/UserMenu";
import type { PageTheme } from "@/hooks/use-page-theme";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface TopBarProps {
  theme: PageTheme;
  onToggleTheme: () => void;
}

export const TopBar = ({ theme, onToggleTheme }: TopBarProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0E1014] border-b border-[rgba(255,255,255,.05)]">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(0,0%,50%)]" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to find right now?"
                className="pl-10 h-10 bg-[#1A1F2B] border-[rgba(255,255,255,.1)] text-[rgba(255,255,255,.85)] placeholder:text-[rgba(255,255,255,.35)] focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </form>
        </div>

        {/* Right side - Theme toggle + User Menu */}
        <div className="flex items-center gap-3 ml-6">
          <button
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 flex items-center justify-center rounded-md text-[hsl(0,0%,55%)] hover:text-white transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
