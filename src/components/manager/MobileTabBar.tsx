import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Columns3, Calendar, Sparkles, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FileText, Rocket, Mail, Handshake, Brain } from "lucide-react";

const boards = [
  { id: "content", label: "Content Pipeline", icon: FileText, path: "/manage/board/content" },
  { id: "platform", label: "ProvenAI Platform", icon: Rocket, path: "/manage/board/platform" },
  { id: "funnel", label: "Funnel & Email", icon: Mail, path: "/manage/board/funnel" },
  { id: "bizdev", label: "Business Dev", icon: Handshake, path: "/manage/board/bizdev" },
  { id: "strategy", label: "Strategy & Horizon", icon: Brain, path: "/manage/board/strategy" },
];

interface TabItem {
  label: string;
  icon: typeof LayoutDashboard;
  path?: string;
  action?: "boards";
}

const tabs: TabItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/manage" },
  { label: "Focus", icon: Crosshair, path: "/manage/focus" },
  { label: "Boards", icon: Columns3, action: "boards" },
  { label: "Calendar", icon: Calendar, path: "/manage/calendar" },
  { label: "AI", icon: Sparkles, path: "/manage/ai" },
];

export default function MobileTabBar() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActiveTab = (tab: TabItem) => {
    if (tab.path) return location.pathname === tab.path;
    if (tab.action === "boards") return location.pathname.startsWith("/manage/board");
    return false;
  };

  const handleTabClick = (tab: TabItem) => {
    if (tab.path) {
      navigate(tab.path);
    } else if (tab.action === "boards") {
      setSheetOpen(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#161b22] border-t border-[#30363d] flex items-center justify-around px-2">
        {tabs.map((tab) => {
          const active = isActiveTab(tab);
          return (
            <button
              key={tab.label}
              onClick={() => handleTabClick(tab)}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 relative"
            >
              {/* Active dot indicator */}
              {active && (
                <span className="absolute top-1 w-1.5 h-1.5 rounded-full bg-[#00bcd4]" />
              )}
              <tab.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  active ? "text-[#00bcd4]" : "text-[#8b949e]",
                  tab.label === "AI" && active && "text-[#e91e8c]"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  active ? "text-[#00bcd4]" : "text-[#8b949e]",
                  tab.label === "AI" && active && "text-[#e91e8c]"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Board selector sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="bg-[#161b22] border-t border-[#30363d] rounded-t-2xl p-0">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="text-[#c9d1d9] font-mono text-base">Select Board</SheetTitle>
          </SheetHeader>
          <div className="px-3 pb-6 space-y-1">
            {boards.map((b) => {
              const isActive = location.pathname === b.path;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    navigate(b.path);
                    setSheetOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-[#1c2128] text-[#00bcd4] border border-[#00bcd4]/30"
                      : "text-[#c9d1d9] hover:bg-[#1c2128]"
                  )}
                >
                  <b.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{b.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
