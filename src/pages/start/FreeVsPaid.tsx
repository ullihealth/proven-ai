import { AppLayout } from "@/components/layout/AppLayout";
import { ContentPageTemplate } from "@/components/content/ContentPageTemplate";
import { Check, X } from "lucide-react";

const FreeVsPaid = () => {
  const features = [
    { feature: "Daily Flow content", free: true, paid: true },
    { feature: "Orientation materials", free: true, paid: true },
    { feature: "Free courses", free: true, paid: true },
    { feature: "Guides library", free: true, paid: true },
    { feature: "Basic prompts", free: true, paid: true },
    { feature: "Tools directory", free: true, paid: true },
    { feature: "Premium courses", free: false, paid: true },
    { feature: "Advanced prompts", free: false, paid: true },
    { feature: "Priority support", free: false, paid: true },
    { feature: "Live sessions", free: false, paid: true },
    { feature: "Early access to new content", free: false, paid: true },
  ];

  return (
    <AppLayout>
      <ContentPageTemplate
        title="Free vs Paid"
        description="A clear, honest comparison of what's included at each membership level."
        whoFor="Members considering whether to upgrade their membership"
        whyMatters="Make an informed decision about investing in your AI education"
        lastUpdated="January 20, 2026"
      >
        <section className="space-y-6">
          <h2>What's the difference?</h2>
          <p>
            Our free membership gives you access to a substantial amount of content — 
            enough to get started and make real progress. The paid membership adds 
            premium courses, advanced resources, and enhanced support.
          </p>

          <div className="overflow-hidden rounded-lg border border-border mt-6">
            <table className="w-full">
              <thead className="bg-pai-surface">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Feature</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground w-24">Free</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground w-24">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {features.map((row) => (
                  <tr key={row.feature}>
                    <td className="px-4 py-3 text-sm text-pai-text-secondary">{row.feature}</td>
                    <td className="px-4 py-3 text-center">
                      {row.free ? (
                        <Check className="h-5 w-5 text-pai-success mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-pai-text-muted mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.paid ? (
                        <Check className="h-5 w-5 text-pai-success mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-pai-text-muted mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Our philosophy on pricing</h2>
          <p>
            We believe in giving away substantial value for free. Many members 
            find everything they need in the free tier. The paid tier is for 
            those who want to go deeper and faster, with additional support 
            along the way.
          </p>

          <div className="mt-6 p-4 rounded-lg bg-pai-surface border border-pai-border-subtle">
            <p className="text-sm text-pai-text-secondary">
              <strong className="text-foreground">No pressure:</strong> You can always 
              start with the free membership and upgrade later if you find value. 
              We'd rather you take your time and make the right decision for you.
            </p>
          </div>
        </section>
      </ContentPageTemplate>
    </AppLayout>
  );
};

export default FreeVsPaid;
