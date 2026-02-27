import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ContentItem } from "@/components/content/ContentItem";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type CheckoutItem = {
  id: string;
  sku: string;
  title: string;
  description: string;
  whoFor: string;
  whyMatters: string;
  href: string;
  lastUpdated: string;
  price: number;
};

const paidCourses: CheckoutItem[] = [
  {
    id: "membership_lifetime",
    sku: "membership_lifetime",
    title: "AI Mastery Program",
    description: "Our flagship comprehensive program covering everything from basics to advanced applications.",
    whoFor: "Committed learners ready for deep expertise",
    whyMatters: "The complete path from beginner to proficient",
    href: "/courses/paid/ai-mastery",
    lastUpdated: "January 25, 2026",
    price: 497,
  },
  {
    id: "course_business_leaders",
    sku: "course_business_leaders",
    title: "AI for Business Leaders",
    description: "Strategic AI knowledge for decision-makers and team leads.",
    whoFor: "Managers and executives",
    whyMatters: "Lead your team through AI adoption with confidence",
    href: "/courses/paid/business-leaders",
    lastUpdated: "January 20, 2026",
    price: 297,
  },
  {
    id: "course_advanced_prompts",
    sku: "course_advanced_prompts",
    title: "Advanced Prompt Engineering",
    description: "Master the art and science of getting exactly what you need from AI.",
    whoFor: "Power users ready to go beyond basics",
    whyMatters: "Unlock the full potential of AI tools",
    href: "/courses/paid/advanced-prompts",
    lastUpdated: "January 15, 2026",
    price: 197,
  },
];

const testOffer: CheckoutItem = {
  id: "test-course-1",
  sku: "test-course-1",
  title: "Test Course ($1)",
  description: "Temporary QA-only checkout item for validating Stripe and SaaS Desk sync.",
  whoFor: "Internal QA testing only",
  whyMatters: "Validates referral attribution, payment webhooks, and commission handoff",
  href: "/courses/paid",
  lastUpdated: "February 26, 2026",
  price: 1,
};

const PaidCourses = () => {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [testOfferEnabled, setTestOfferEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/payments/test-offer-config", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { enabled?: boolean }) => {
        setTestOfferEnabled(Boolean(data.enabled));
      })
      .catch(() => {
        setTestOfferEnabled(false);
      });
  }, []);

  const startCheckout = async (course: CheckoutItem) => {
    setLoadingId(course.id);
    try {
      const res = await fetch("/api/payments/checkout-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: course.id,
          product_sku: course.sku,
          product_name: course.title,
          amount: course.price,
          currency: "USD",
        }),
      });

      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout");
      }

      window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Checkout unavailable",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Paid Courses"
        description="Premium courses for those ready to go deeper. Comprehensive, structured learning with enhanced support."
        badge="Premium"
      />

      <div className="p-4 rounded-lg bg-pai-surface border border-pai-border-subtle mb-6">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium">Premium Content</p>
            <p className="mt-1 text-sm text-pai-text-secondary">
              These courses require a paid membership. Upgrade your account to access.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {paidCourses.map((course) => {
          const isLoading = loadingId === course.id;
          return (
            <div key={course.id} className="border-b last:border-b-0 border-border">
              <ContentItem {...course} variant="list" />
              <div className="px-4 pb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">${course.price} one-time</p>
                <Button onClick={() => startCheckout(course)} disabled={isLoading}>
                  {isLoading ? "Redirecting..." : "Buy now"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {testOfferEnabled && (
        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">QA Test Offer (temporary)</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Test-only purchase path for Stripe test mode and SaaS Desk commission validation.
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">$1.00 USD • test-course-1</p>
            <Button onClick={() => startCheckout(testOffer)} disabled={loadingId === testOffer.id}>
              {loadingId === testOffer.id ? "Redirecting..." : "Buy Test Course ($1)"}
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default PaidCourses;
