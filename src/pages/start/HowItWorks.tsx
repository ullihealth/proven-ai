import { AppLayout } from "@/components/layout/AppLayout";
import { ContentPageTemplate } from "@/components/content/ContentPageTemplate";

const HowItWorks = () => {
  return (
    <AppLayout>
      <ContentPageTemplate
        title="How Proven AI Works"
        description="Understand the structure, rhythm, and philosophy that makes Proven AI different from other AI learning platforms."
        whoFor="Members who want to understand the methodology behind Proven AI"
        whyMatters="Understanding the system helps you get the most value from your membership"
        lastUpdated="January 25, 2026"
      >
        <section className="space-y-6">
          <h2>Our Philosophy</h2>
          <p>
            We believe that learning AI should be calm, structured, and practical. 
            Unlike platforms that bombard you with endless content, we focus on 
            quality over quantity and clarity over complexity.
          </p>

          <h2>The Daily Flow</h2>
          <p>
            Each weekday has a dedicated theme. This structure helps you:
          </p>
          <ul className="list-disc list-inside space-y-2 text-pai-text-secondary">
            <li>Know what to expect each day</li>
            <li>Build habits around learning</li>
            <li>Avoid the overwhelm of unstructured content</li>
          </ul>

          <div className="grid gap-3 mt-4">
            {[
              { day: "Monday", theme: "Foundations", desc: "Core concepts and principles" },
              { day: "Tuesday", theme: "Tools & Tips", desc: "Practical techniques and shortcuts" },
              { day: "Wednesday", theme: "Work & Wealth", desc: "Professional applications and opportunities" },
              { day: "Thursday", theme: "What's Changing", desc: "Curated news and developments" },
              { day: "Friday", theme: "Flexible / Insight", desc: "Deeper thinking and varied topics" },
            ].map((item) => (
              <div key={item.day} className="p-4 rounded-lg bg-pai-surface border border-pai-border-subtle">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-foreground">{item.day}:</span>
                  <span className="text-primary font-medium">{item.theme}</span>
                </div>
                <p className="text-sm text-pai-text-secondary mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <h2>Learning at Your Pace</h2>
          <p>
            Everything in Proven AI is designed to be consumed at your own pace. 
            There are no deadlines, no leaderboards, and no pressure. 
            We're here to support your journey, not rush you through it.
          </p>

          <h2>Support When You Need It</h2>
          <p>
            If you ever feel stuck or have questions, our support section and 
            community are here to help. We're building this together.
          </p>
        </section>
      </ContentPageTemplate>
    </AppLayout>
  );
};

export default HowItWorks;
