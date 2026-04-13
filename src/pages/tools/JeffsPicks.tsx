import { Link } from "react-router-dom";
import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ToolsNavTabs } from "@/components/tools/ToolsNavTabs";
import { toolsData } from "@/data/toolsData";
import { jeffsPicksCategories } from "@/data/jeffsPicksData";
import { ArrowRight, Star, Check, X } from "lucide-react";
import { getCoreToolsCardSettings, getToolLogo, hslToCss, shadowFromIntensity } from "@/lib/tools";

const JeffsPicks = () => {
  const settings = useMemo(() => getCoreToolsCardSettings(), []);

  // Resolve each category's tool IDs to full ToolData objects, filtering out missing/blank IDs
  const resolvedCategories = jeffsPicksCategories.map((cat) => ({
    name: cat.name,
    tools: cat.toolIds
      .filter((id) => id.trim() !== "")
      .map((id) => toolsData.find((t) => t.id === id))
      .filter(Boolean) as typeof toolsData,
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
              {/* Category heading */}
              <h2
                className="text-base font-semibold mb-4"
                style={{ color: hslToCss(settings.titleColor) }}
              >
                {cat.name}
              </h2>

              {cat.tools.length > 0 ? (
                <div className="space-y-4">
                  {cat.tools.map((tool) => {
                    const logo = getToolLogo(tool.id);
                    return (
                      <Link
                        key={tool.id}
                        to={`/tools/${tool.id}`}
                        className="block p-5 rounded-xl transition-all group active:scale-[0.99] touch-manipulation"
                        style={{
                          backgroundColor: hslToCss(settings.cardBackground),
                          borderWidth: "1px",
                          borderStyle: "solid",
                          borderColor: hslToCss(settings.cardBorder),
                          boxShadow: shadowFromIntensity(settings.cardShadow ?? 0, settings.cardShadowDirection ?? 180),
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = hslToCss(settings.cardHoverBorder);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = hslToCss(settings.cardBorder);
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Badge + category */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
                                style={{
                                  backgroundColor: hslToCss(settings.badgeBackground),
                                  color: hslToCss(settings.badgeTextColor),
                                }}
                              >
                                <Star className="h-3 w-3" />
                                Jeff's Pick
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: hslToCss(settings.descriptionColor) }}
                              >
                                {tool.category}
                              </span>
                            </div>

                            {/* Logo + name */}
                            <div className="flex items-center gap-3">
                              {logo && (
                                <img
                                  src={logo}
                                  alt={`${tool.name} logo`}
                                  className="w-8 h-8 rounded object-contain"
                                />
                              )}
                              <h3
                                className="text-lg font-semibold group-hover:text-primary transition-colors"
                                style={{ color: hslToCss(settings.titleColor) }}
                              >
                                {tool.name}
                              </h3>
                            </div>

                            {/* Description */}
                            <p
                              className="mt-2 text-sm leading-relaxed"
                              style={{ color: hslToCss(settings.descriptionColor) }}
                            >
                              {tool.sections.whatProblemSolves}
                            </p>

                            {/* Use when / Skip if sub-cards */}
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div
                                className="p-3 rounded-lg"
                                style={{
                                  backgroundColor: hslToCss(settings.subCardPositiveBackground),
                                  borderWidth: "1px",
                                  borderStyle: "solid",
                                  borderColor: hslToCss(settings.subCardPositiveBorder),
                                  boxShadow: shadowFromIntensity(settings.subCardShadow ?? 0, settings.subCardShadowDirection ?? 180),
                                }}
                              >
                                <p
                                  className="text-xs font-medium mb-1.5"
                                  style={{ color: hslToCss(settings.subCardTitleColor) }}
                                >
                                  Use when you...
                                </p>
                                <ul className="space-y-1">
                                  {tool.sections.whoFor.goodFit.slice(0, 2).map((item, i) => (
                                    <li
                                      key={i}
                                      className="text-xs flex items-start gap-1.5"
                                      style={{ color: hslToCss(settings.subCardTextColor) }}
                                    >
                                      <Check
                                        className="h-3 w-3 mt-0.5 flex-shrink-0"
                                        style={{ color: hslToCss(settings.positiveAccent) }}
                                      />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div
                                className="p-3 rounded-lg"
                                style={{
                                  backgroundColor: hslToCss(settings.subCardNegativeBackground),
                                  borderWidth: "1px",
                                  borderStyle: "solid",
                                  borderColor: hslToCss(settings.subCardNegativeBorder),
                                  boxShadow: shadowFromIntensity(settings.subCardShadow ?? 0, settings.subCardShadowDirection ?? 180),
                                }}
                              >
                                <p
                                  className="text-xs font-medium mb-1.5"
                                  style={{ color: hslToCss(settings.subCardTitleColor) }}
                                >
                                  Skip if you...
                                </p>
                                <ul className="space-y-1">
                                  {tool.sections.whoFor.notGoodFit.slice(0, 2).map((item, i) => (
                                    <li
                                      key={i}
                                      className="text-xs flex items-start gap-1.5"
                                      style={{ color: hslToCss(settings.subCardTextColor) }}
                                    >
                                      <X
                                        className="h-3 w-3 mt-0.5 flex-shrink-0"
                                        style={{ color: hslToCss(settings.negativeAccent) }}
                                      />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div
                            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors flex-shrink-0"
                            style={{ backgroundColor: `${hslToCss(settings.accentColor)}20` }}
                          >
                            <ArrowRight
                              className="h-5 w-5 group-hover:translate-x-0.5 transition-transform"
                              style={{ color: hslToCss(settings.accentColor) }}
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                /* Empty category placeholder */
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
