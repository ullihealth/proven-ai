import { AppLayout } from "@/components/layout/AppLayout";
import { GovernanceHeader } from "@/components/admin";
import { CheckCircle2, Circle } from "lucide-react";

const ReviewChecklist = () => {
  const checklistCategories = [
    {
      title: "Functional Checks",
      items: [
        "Tool loads and basic functionality works",
        "Pricing information is accurate and current",
        "Website/app is accessible (no broken links)",
        "Core features match the tool description",
        "Mobile experience is acceptable (if applicable)",
      ],
    },
    {
      title: "Trust & Safety",
      items: [
        "Company/creator has a verifiable identity",
        "Privacy policy exists and is reasonable",
        "No obvious red flags (scam indicators, fake reviews)",
        "Data handling practices are disclosed",
        "No history of security breaches or major controversies",
      ],
    },
    {
      title: "Audience Fit (Over-40s)",
      items: [
        "Interface is clear and not overly complex",
        "Text is readable (good contrast, reasonable font sizes)",
        "Jargon is minimal or well-explained",
        "Support/help resources are accessible",
        "Learning curve is appropriate for non-technical users",
      ],
    },
    {
      title: "Stability Signals",
      items: [
        "Company has been operating for 1+ years (or has strong backing)",
        "Regular updates or active development",
        "Responsive customer support",
        "Clear business model (not reliant on unsustainable funding)",
        "Positive user reviews from credible sources",
      ],
    },
  ];

  return (
    <AppLayout>
      <GovernanceHeader title="Review Checklist" />

      <p className="text-muted-foreground mb-6">
        Use this checklist when evaluating tools for promotion. A tool should pass all items 
        in a category to be considered for advancement on the trust ladder.
      </p>

      <div className="space-y-6">
        {checklistCategories.map((category) => (
          <div key={category.title} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h2 className="font-semibold text-foreground">{category.title}</h2>
            </div>
            <div className="p-5 space-y-3">
              {category.items.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Circle className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Usage Note */}
      <div className="mt-8 p-4 bg-muted/50 border border-border rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> This checklist is a guide, not a strict pass/fail test. 
          Use judgment for edge cases and document any exceptions in the tool's review notes.
        </p>
      </div>
    </AppLayout>
  );
};

export default ReviewChecklist;
