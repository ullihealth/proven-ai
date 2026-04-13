import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ToolsNavTabs } from "@/components/tools/ToolsNavTabs";
import { directoryTools, categoryInfo, pricingInfo } from "@/data/directoryToolsData";
import { jeffsPicksCategories } from "@/data/jeffsPicksData";
import { ArrowRight, Star } from "lucide-react";
import { getDirectoryCardSettings, getToolLogo, hslToCss, shadowFromIntensity } from "@/lib/tools";

const JeffsPicks = () => {
  const settings = useMemo(() => getDirectoryCardSettings(), []);

  // Resolve each category's tool IDs to full DirectoryTool objects
  const resolvedCategories = jeffsPicksCategories.map((cat) => ({
    name: cat.name,
    tools: cat.toolIds
      .filter((id) => id.trim() !== "")
      .map((id) => directoryTools.find((t) => t.id === id))
      .filter(Boolean) as typeof directoryTools,
  }));

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
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: hslToCss(settings.calloutTitleColor ?? "222 47% 11%") }}
              >
                Personally tested
              </p>
              <p
                className="text-sm mt-1 leading-relaxed"
                style={{ color: hslToCss(settings.calloutTextColor ?? "220 9% 46%") }}
              >
                Every tool here is something Jeff uses regularly. No paid placements, no affiliate deals — just what actually works.
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-10">
          {resolvedCategories.map((cat) => (
            <section key={cat.name}>
              <h2
                className="text-base font-semibold mb-4"
                style={{ color: hslToCss(settings.titleColor) }}
              >
                {cat.name}
              </h2>

              {cat.tools.length > 0 ? (
                <div className="space-y-3">
                  {cat.tools.map((tool) => {
                    const logo = getToolLogo(tool.id);
                    return (
                      <a
                        key={tool.id}
                        href={tool.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-xl transition-all group active:scale-[0.99] touch-manipulation"
                        style={{
                          backgroundColor: hslToCss(settings.cardBackground),
                          borderWidth: "1px",
                          borderStyle: "solid",
                          borderColor: hslToCss(settings.cardBorder),
                          boxShadow: shadowFromIntensity(settings.cardShadow ?? 0, settings.cardShadowDirection ?? 180),
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = hslToCss(settings.cardHoverBorder);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = hslToCss(settings.cardBorder);
                        }}
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                            {logo && (
                              <img
                                src={logo}
                                alt={`${tool.name} logo`}
                                className="w-6 h-6 rounded object-contain"
                              />
                            )}
                            <h3
                              className="font-semibold text-base group-hover:text-primary transition-colors"
                              style={{ color: hslToCss(settings.titleColor) }}
                            >
                              {tool.name}
                            </h3>
                            <span
                              className="text-xs"
                              style={{ color: hslToCss(settings.descriptionColor), opacity: 0.7 }}
                            >
                              {categoryInfo[tool.primaryCategory]?.label ?? tool.primaryCategory}
                            </span>
                          </div>
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                            style={{ backgroundColor: `${hslToCss(settings.accentColor)}20` }}
                          >
                            <ArrowRight
                              className="h-4 w-4 group-hover:translate-x-0.5 transition-transform"
                              style={{ color: hslToCss(settings.accentColor) }}
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <p
                          className="mt-2 text-sm leading-relaxed line-clamp-2"
                          style={{ color: hslToCss(settings.descriptionColor) }}
                        >
                          {tool.bestFor}
                        </p>

                        {/* Meta */}
                        <div
                          className="mt-3 flex items-center gap-2 flex-wrap text-xs"
                          style={{ color: hslToCss(settings.descriptionColor) }}
                        >
                          <span
                            className="px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: hslToCss(settings.subCardPositiveBackground),
                              color: hslToCss(settings.subCardTextColor),
                            }}
                          >
                            {pricingInfo[tool.pricingModel].label}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="p-4 rounded-xl text-sm"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px dashed rgba(255,255,255,0.1)",
                    color: "rgba(201,209,217,0.4)",
                  }}
                >
                  Coming soon
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default JeffsPicks;
