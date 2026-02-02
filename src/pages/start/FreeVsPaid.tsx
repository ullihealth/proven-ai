import { AppLayout } from "@/components/layout/AppLayout";
import { ContentPageTemplate } from "@/components/content/ContentPageTemplate";
import { Check, X } from "lucide-react";
const FreeVsPaid = () => {
  const features = [{
    feature: "Daily Flow content",
    free: true,
    paid: true
  }, {
    feature: "Orientation materials",
    free: true,
    paid: true
  }, {
    feature: "Free courses",
    free: true,
    paid: true
  }, {
    feature: "Guides library",
    free: true,
    paid: true
  }, {
    feature: "Basic prompts",
    free: true,
    paid: true
  }, {
    feature: "Tools directory",
    free: true,
    paid: true
  }, {
    feature: "Premium courses",
    free: false,
    paid: true
  }, {
    feature: "Advanced prompts",
    free: false,
    paid: true
  }, {
    feature: "Priority support",
    free: false,
    paid: true
  }, {
    feature: "Live sessions",
    free: false,
    paid: true
  }, {
    feature: "Early access to new content",
    free: false,
    paid: true
  }];
  return <AppLayout>
      <ContentPageTemplate title="Free vs Paid" description="A clear, honest comparison of what's included at each membership level." whoFor="Members considering whether to upgrade their membership" whyMatters="Make an informed decision about investing in your AI education" lastUpdated="January 20, 2026">
        <section className="space-y-6">
          <h2>What's the difference?</h2>
          <p> Proven AI is a one-time purchase with lifetime access.
Your membership includes a substantial amount of content — enough to get real value and make meaningful progress. From time to time, we also run optional live releases for people who want to take part in real time.</p>

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
                {features.map(row => <tr key={row.feature}>
                    <td className="px-4 py-3 text-sm text-pai-text-secondary">{row.feature}</td>
                    <td className="px-4 py-3 text-center">
                      {row.free ? <Check className="h-5 w-5 text-pai-success mx-auto" /> : <X className="h-5 w-5 text-pai-text-muted mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.paid ? <Check className="h-5 w-5 text-pai-success mx-auto" /> : <X className="h-5 w-5 text-pai-text-muted mx-auto" />}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>

          <h2>Our philosophy on pricing</h2>
          <p>
            We believe AI education should be generous, fair, and calm — not built 
            on pressure or artificial urgency.
          </p>
          <p>
            A large portion of the Proven AI library is included as part of the 
            lifetime membership, and many members find that's enough to get real 
            value and make significant progress.
          </p>
          <p>
            The lifetime membership provides access to the full Proven AI library 
            as it continues to grow.
          </p>
          <p>
            Some new courses are released first with optional live access, which 
            may include workshops or Q&A during the release period.
          </p>
          <p>
            The core learning material from those courses is added to the Proven AI 
            library typically 3–6 months after release, once it has been refined 
            and is ready to be evergreen. We don't promise a fixed timeline for this.
          </p>
          <p>
            Nothing is ever removed, and Proven AI access has no subscriptions or renewals.
          </p>

          <div className="mt-6 p-4 rounded-lg bg-pai-surface border border-pai-border-subtle">
            <p className="text-sm text-pai-text-secondary">
              <strong className="text-foreground">No Pressure:</strong> Proven AI is a 
              one-time purchase with lifetime access. There are no subscriptions, no 
              renewals, and nothing is ever taken away.
            </p>
            <p className="text-sm text-pai-text-secondary mt-2">
              Learn at your own pace and come back whenever you need.
            </p>
          </div>
        </section>
      </ContentPageTemplate>
    </AppLayout>;
};
export default FreeVsPaid;