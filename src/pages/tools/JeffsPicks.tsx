import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ToolsNavTabs } from "@/components/tools/ToolsNavTabs";
import { getCoreToolsCardSettings, hslToCss } from "@/lib/tools";
import { Star } from "lucide-react";

const JeffsPicks = () => {
  const settings = useMemo(() => getCoreToolsCardSettings(), []);

  return (
    <AppLayout>
      <div
        className="-mx-4 -mt-4 px-4 pt-4 pb-8 min-h-full bg-[var(--cc-bg)]"
      >
        <ToolsNavTabs activeTab="jeffs-picks" />

        <PageHeader
          title="Jeff's Picks"
          description="The AI tools Jeff uses every week. Personally tested, honestly reviewed."
        />

        {/* Intro callout */}
        <div
          className="mb-8 p-4 rounded-xl"
          style={{
            backgroundColor: hslToCss(settings.calloutBackground ?? "217 91% 60% / 0.05"),
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: hslToCss(settings.calloutBorder ?? "217 91% 60% / 0.1"),
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: hslToCss(settings.calloutIconBackground ?? "217 91% 60% / 0.1") }}
            >
              <Star
                className="h-4 w-4"
                style={{ color: hslToCss(settings.accentColor) }}
              />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(201,209,217,0.8)" }}>
              These are the tools I personally use and recommend. Coming soon — check back shortly for my curated list.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default JeffsPicks;
