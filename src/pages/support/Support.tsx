import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Mail, MessageCircle, Clock, ExternalLink } from "lucide-react";

const Support = () => {
  return (
    <AppLayout>
      <PageHeader
        title="Get Help"
        description="We're here to support you. Choose the option that works best for your situation."
      />

      <div className="grid gap-4">
        <div className="p-6 rounded-lg bg-card border border-border">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Email Support</h3>
              <p className="mt-1 text-sm text-pai-text-secondary">
                Send us a detailed message and we'll respond within 24-48 hours.
              </p>
              <a
                href="mailto:support@provenai.com"
                className="inline-flex items-center mt-3 text-sm font-medium text-primary hover:underline"
              >
                support@provenai.com
              </a>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card border border-border">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Community Forum</h3>
              <p className="mt-1 text-sm text-pai-text-secondary">
                Ask questions, share insights, and connect with other members.
              </p>
              <a
                href="https://community.provenai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-primary hover:underline"
              >
                Visit Community
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card border border-border">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Response Times</h3>
              <p className="mt-1 text-sm text-pai-text-secondary">
                We aim to respond to all inquiries within 24-48 hours during business days. 
                Paid members receive priority support with faster response times.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {[
            {
              q: "How do I upgrade my membership?",
              a: "Visit your account settings page and click on 'Upgrade Membership' to see available options.",
            },
            {
              q: "Can I download content for offline use?",
              a: "Yes, most guides and course materials are available as PDFs for offline reading.",
            },
            {
              q: "What if I'm completely new to AI?",
              a: "Start with our Orientation page and the 'AI Foundations for Professionals' free course. We've designed these specifically for beginners.",
            },
            {
              q: "Is my data kept private?",
              a: "Absolutely. We never share your personal information. Read our privacy policy for full details.",
            },
          ].map((faq) => (
            <div key={faq.q} className="p-4 rounded-lg bg-pai-surface border border-pai-border-subtle">
              <h4 className="font-medium text-foreground">{faq.q}</h4>
              <p className="mt-2 text-sm text-pai-text-secondary">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </AppLayout>
  );
};

export default Support;
