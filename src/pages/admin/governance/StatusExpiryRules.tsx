import { AppLayout } from "@/components/layout/AppLayout";
import { GovernanceHeader } from "@/components/admin";
import { Clock, AlertTriangle, ArrowDown, Info } from "lucide-react";

const StatusExpiryRules = () => {
  const rules = [
    {
      level: "Recommended",
      icon: Clock,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
      recheckPeriod: "12 months",
      description: "Recommended tools should be rechecked annually to ensure they still meet our standards.",
      flagAfter: "12 months since last review",
      action: "Flag for review. If not revalidated within 30 days, consider downgrade to Reviewed.",
    },
    {
      level: "Core",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
      recheckPeriod: "6 months",
      description: "Core tools require more frequent validation due to their prominence in the directory.",
      flagAfter: "6 months since last review",
      action: "Mandatory revalidation. If not completed, tool must be downgraded to Recommended.",
    },
  ];

  return (
    <AppLayout>
      <GovernanceHeader title="Status & Expiry Rules" />

      <p className="text-muted-foreground mb-6">
        To maintain trust and accuracy, tools at higher trust levels require periodic revalidation. 
        These rules define the review cadence and consequences for expired reviews.
      </p>

      <div className="space-y-4 mb-8">
        {rules.map((rule) => (
          <div key={rule.level} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${rule.bgColor} flex items-center justify-center`}>
                <rule.icon className={`h-5 w-5 ${rule.iconColor}`} />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{rule.level}</h2>
                <p className="text-sm text-muted-foreground">Recheck every {rule.recheckPeriod}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-foreground">{rule.description}</p>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-muted-foreground mb-1">Flag Trigger</p>
                <p className="text-foreground">{rule.flagAfter}</p>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-muted-foreground mb-1">Required Action</p>
                <p className="text-foreground">{rule.action}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Downgrade Flow */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Downgrade Flow</h2>
        </div>
        
        <div className="flex items-center gap-3 text-sm mb-4">
          <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-md font-medium">Core</span>
          <ArrowDown className="h-4 w-4 text-muted-foreground" />
          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-md font-medium">Recommended</span>
          <ArrowDown className="h-4 w-4 text-muted-foreground" />
          <span className="px-3 py-1.5 bg-sky-500/10 text-sky-600 rounded-md font-medium">Reviewed</span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          If a tool fails revalidation or the review expires without action, it should be downgraded one level. 
          This ensures the directory maintains accurate trust signals.
        </p>
      </div>

      {/* Future Automation Note */}
      <div className="p-4 bg-muted/50 border border-border rounded-lg flex gap-3">
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Future Automation</p>
          <p className="text-sm text-muted-foreground">
            Automatic flagging and downgrade enforcement will be implemented once the backend is connected. 
            For now, admins should manually check review dates in the Review Queue.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default StatusExpiryRules;
