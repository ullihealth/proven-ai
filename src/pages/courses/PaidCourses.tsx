import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ContentItem } from "@/components/content/ContentItem";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Course } from "@/lib/courses/types";
import { useAuth } from "@/lib/auth";
import { getCourseAccess, formatCoursePrice } from "@/utils/courseAccess";

const testOffer = {
  id: "test-course-1",
  sku: "test-course-1",
  title: "Test Course ($1)",
  description: "Temporary QA-only checkout item for validating Stripe and SaaS Desk sync.",
  href: "/courses/paid",
  lastUpdated: "February 26, 2026",
  price: 1,
};

const PaidCourses = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [testOfferEnabled, setTestOfferEnabled] = useState(false);
  const [paidCourses, setPaidCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    // Load paid courses from DB (fixed price or premium)
    fetch("/api/admin/courses", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { ok?: boolean; courses?: Course[] }) => {
        if (data.ok && data.courses) {
          const fixed = data.courses
            .filter((c) => (
              (c.priceModel === "fixed" && c.fixedPrice && c.fixedPrice > 0) ||
              c.isPremium
            ) && (c.isPublished ?? true))
            .sort((a, b) => (b.fixedPrice ?? 0) - (a.fixedPrice ?? 0));
          setPaidCourses(fixed);
        }
      })
      .catch(() => {/* silently fail */})
      .finally(() => setCoursesLoading(false));
  }, []);

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

  const startCheckout = async (id: string, sku: string, title: string, price: number) => {
    setLoadingId(id);
    try {
      const res = await fetch("/api/payments/checkout-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: id,
          product_sku: sku,
          product_name: title,
          amount: price,
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
        title="Advanced Courses"
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
        {coursesLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading courses...</div>
        ) : paidCourses.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No paid courses available.</div>
        ) : (
          paidCourses.map((course) => {
            const isLoading = loadingId === course.id;
            const access = getCourseAccess(course, user?.role ?? null);
            const isPremium = Boolean(course.isPremium);
            return (
              <div key={course.id} className="border-b last:border-b-0 border-border">
                <ContentItem
                  title={course.title}
                  description={course.description}
                  href={course.href}
                  lastUpdated={course.lastUpdated}
                  variant="list"
                />
                <div className="px-4 pb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isPremium && access.phase === 'premium_included' ? (
                      <Badge className="bg-green-600 text-white border-0 text-xs">Included in Membership</Badge>
                    ) : isPremium ? (
                      <Badge className="bg-amber-500 text-white border-0 text-xs">Premium</Badge>
                    ) : null}
                    {access.phase === 'premium_reduced' && (
                      <span className="text-xs text-muted-foreground">Price reduced</span>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {access.isFree
                        ? 'Included free'
                        : access.priceCents
                          ? `${formatCoursePrice(access.priceCents)} one-time`
                          : course.fixedPrice
                            ? `$${course.fixedPrice} one-time`
                            : ''}
                    </p>
                  </div>
                  {access.requiresPurchase && (
                    <Button
                      onClick={() => startCheckout(
                        course.id,
                        course.id,
                        course.title,
                        access.priceCents ? access.priceCents / 100 : course.fixedPrice!
                      )}
                      disabled={isLoading}
                    >
                      {isLoading ? "Redirecting..." : "Buy now"}
                    </Button>
                  )}
                  {!access.requiresPurchase && isPremium && (
                    <Badge variant="outline" className="text-xs">Access granted</Badge>
                  )}
                  {!access.requiresPurchase && !isPremium && (
                    <Button
                      onClick={() => startCheckout(course.id, course.id, course.title, course.fixedPrice!)}
                      disabled={isLoading}
                    >
                      {isLoading ? "Redirecting..." : "Buy now"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {testOfferEnabled && (
        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">QA Test Offer (temporary)</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Test-only purchase path for Stripe test mode and SaaS Desk commission validation.
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">$1.00 USD • test-course-1</p>
            <Button
              onClick={() => startCheckout(testOffer.id, testOffer.sku, testOffer.title, testOffer.price)}
              disabled={loadingId === testOffer.id}
            >
              {loadingId === testOffer.id ? "Redirecting..." : "Buy Test Course ($1)"}
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default PaidCourses;

