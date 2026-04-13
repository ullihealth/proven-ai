import { Link } from "react-router-dom";
import { useMemo } from "react";
import { getCoreToolsCardSettings, hslToCss } from "@/lib/tools";

export type ToolsNavTab = "core-tools" | "directory" | "jeffs-picks";

interface ToolsNavTabsProps {
  activeTab: ToolsNavTab;
}

const TABS: { label: string; href: string; tab: ToolsNavTab }[] = [
  { label: "Core Tools",   href: "/core-tools",        tab: "core-tools" },
  { label: "All Tools",    href: "/tools/directory",   tab: "directory" },
  { label: "Jeff's Picks", href: "/tools/jeffs-picks", tab: "jeffs-picks" },
];

export function ToolsNavTabs({ activeTab }: ToolsNavTabsProps) {
  const settings = useMemo(() => getCoreToolsCardSettings(), []);
  const accentCss = hslToCss(settings.accentColor ?? "217 91% 60%");

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {TABS.map(({ label, href, tab }) => {
        const isActive = tab === activeTab;
        return (
          <Link
            key={tab}
            to={href}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: isActive ? accentCss : "rgba(255,255,255,0.05)",
              color: isActive ? "#fff" : "rgba(201,209,217,0.7)",
              border: isActive
                ? "1px solid transparent"
                : "1px solid rgba(255,255,255,0.1)",
              textDecoration: "none",
            }}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
