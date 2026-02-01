import { AppLayout } from "@/components/layout/AppLayout";
import { GovernanceHeader } from "@/components/admin";
import { trustLevelInfo } from "@/data/directoryToolsData";
import { TrustBadge } from "@/components/directory/TrustBadge";
import { AlertCircle } from "lucide-react";

const TrustLadderRules = () => {
  const levels = [
    {
      level: 'unreviewed' as const,
      meaning: "Newly submitted tool. Has not been assessed by an admin yet. Visible in the directory but clearly marked as unvetted.",
      criteria: "Any tool submitted via Quick Capture starts here.",
    },
    {
      level: 'reviewed' as const,
      meaning: "An admin has looked at this tool and confirmed basic information is accurate. Not yet recommended for the audience.",
      criteria: "Passes functional checks and basic trust/safety review.",
    },
    {
      level: 'recommended' as const,
      meaning: "Actively recommended for our Over-40s audience. The tool is stable, trustworthy, and fits our editorial standards.",
      criteria: "Passes all checklist items including audience fit. Admin has tested the tool personally.",
    },
    {
      level: 'core' as const,
      meaning: "Part of the curated Core Tools collection. These are the essential tools we believe every member should know about.",
      criteria: "Must already be Recommended. Limited slots available. Requires 6-month revalidation.",
    },
    {
      level: 'archived' as const,
      meaning: "Tool is no longer recommended. May be discontinued, acquired, or no longer meeting our standards.",
      criteria: "Previously recommended tools that have been sunset or downgraded.",
    },
  ];

  return (
    <AppLayout>
      <GovernanceHeader title="Trust Ladder Rules" />

      <div className="space-y-6">
        {/* Important Note */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Key Distinction</p>
            <p className="text-sm text-muted-foreground">
              <strong>Reviewed ≠ Recommended.</strong> A Reviewed tool has been verified for accuracy, 
              but is not yet endorsed for our audience. Only Recommended and Core tools are actively promoted.
            </p>
          </div>
        </div>

        {/* Trust Levels */}
        <div className="space-y-4">
          {levels.map(({ level, meaning, criteria }) => (
            <div key={level} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <TrustBadge level={level} />
                <span className="font-semibold text-foreground capitalize">
                  {trustLevelInfo[level].label}
                </span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Meaning</p>
                  <p className="text-foreground">{meaning}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Criteria</p>
                  <p className="text-foreground">{criteria}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default TrustLadderRules;
