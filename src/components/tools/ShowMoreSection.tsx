import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { AdvancedSection } from "./AdvancedSection";
import { ToolBulletList } from "./ToolBulletList";
import type { AdvancedSection as AdvancedSectionType } from "@/data/toolsData";

interface ShowMoreSectionProps {
  advancedSections: AdvancedSectionType[];
}

export const ShowMoreSection = ({ advancedSections }: ShowMoreSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!advancedSections || advancedSections.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      {/* Show More / Go Deeper Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-primary/5 border-2 border-dashed border-primary/20 rounded-xl text-primary font-medium hover:bg-primary/10 hover:border-primary/30 transition-all min-h-[56px] touch-manipulation"
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-base">
          {isExpanded ? "Show less" : "Go deeper"}
        </span>
        <ChevronDown
          className={`h-5 w-5 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-3 animate-fade-in">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium px-1">
            Advanced guidance
          </p>
          {advancedSections.map((section, index) => (
            <AdvancedSection key={index} title={section.title}>
              {Array.isArray(section.content) ? (
                <ToolBulletList items={section.content} />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              )}
            </AdvancedSection>
          ))}
        </div>
      )}
    </div>
  );
};
