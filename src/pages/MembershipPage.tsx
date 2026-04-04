import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TierData {
  tier: number;
  price_id: string;
  price_usd: number;
  members_at_this_tier: number;
  tier_limit: number;
  spots_remaining: number;
}

const WHAT_IS_INCLUDED = [
  "Full access to the Proven AI platform, courses, and tools directory",
  "Business Dashboard — Jeff's curated AI business feed, updated regularly",
  "Monthly business hack — one practical AI win for your business, exclusive to members",
  "Weekly AI tools update — what's worth using, what isn't, filtered for business owners",
  "Monthly newsletter — Jeff's honest take on where AI is heading and what it means for your business",
  "One coaching email reply per week — ask your specific business question, get a specific answer",
  "Personalised business onboarding assessment — complete a short form, receive a tailored AI action report for your business",
  "Founding member rate locked for life as long as you remain subscribed",
];

export default function MembershipPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cancelled = searchParams.get("checkout") === "cancelled";

  const [tierData, setTierData] = useState<TierData | null>(null);
  const [tierLoading, setTierLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isPaidMember = user?.role === "paid_member" || user?.role === "admin";

  useEffect(() => {
    fetch("/api/payments/membership-tier")
      .then((r) => r.json())
      .then((d) => setTierData(d as TierData))
      .catch(console.error)
      .finally(() => setTierLoading(false));
  }, []);

  async function handleCheckout() {
    if (!isAuthenticated) {
      navigate("/auth", { state: { from: { pathname: "/membership" } } });
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/payments/membership-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!data.ok || !data.url) {
        setCheckoutError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Unable to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  const spotsTotal = tierData?.tier_limit ?? 50;
  const spotsTaken = tierData?.members_at_this_tier ?? 0;
  const spotsFull = tierData ? tierData.spots_remaining === 0 : false;
  const progressPercent = Math.min(100, Math.round((spotsTaken / spotsTotal) * 100));

  return (
    <div
      style={{ background: "#0d1117", minHeight: "100vh", color: "#c9d1d9" }}
      className="py-16 px-4"
    >
      <div className="max-w-2xl mx-auto space-y-10">

        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold" style={{ color: "#ffffff" }}>
            AI Guidance For Your Business
          </h1>
          <p className="text-lg" style={{ color: "#c9d1d9" }}>
            Ongoing. Practical. Built for experienced professionals who cannot afford to fall behind.
          </p>
        </div>

        {cancelled && (
          <div
            className="rounded-lg p-4 text-sm text-center"
            style={{ background: "#1c2128", border: "1px solid #30363d", color: "#c9d1d9" }}
          >
            Checkout was cancelled — your card was not charged.
          </div>
        )}

        {/* Tier card */}
        <div
          className="rounded-xl p-6 space-y-5"
          style={{ background: "#1c2128", border: "1px solid #30363d" }}
        >
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: "#00bcd4" }}
            >
              Business Founding Member
            </div>
            <div className="text-3xl font-bold" style={{ color: "#ffffff" }}>
              $27/month
            </div>
            <div className="text-sm mt-1" style={{ color: "#8b949e" }}>
              Founding rate — locked for life. Rises to $47 when founding spots fill.
            </div>
          </div>

          {/* Founding spots counter */}
          {tierLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#00bcd4" }} />
            </div>
          ) : spotsFull ? (
            <p className="text-sm" style={{ color: "#8b949e" }}>
              Founding spots filled — current rate $47/month
            </p>
          ) : (
            <div className="space-y-2">
              <div
                className="w-full rounded-full h-2 overflow-hidden"
                style={{ background: "#30363d" }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%`, background: "#00bcd4" }}
                />
              </div>
              <div className="text-xs" style={{ color: "#8b949e" }}>
                {spotsTaken} of {spotsTotal} founding spots taken
              </div>
            </div>
          )}

          <p className="text-xs" style={{ color: "#8b949e" }}>
            No countdown. No pressure. Just facts.
          </p>

          {/* Checklist */}
          <ul className="space-y-2.5">
            {WHAT_IS_INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <CheckCircle2
                  className="h-4 w-4 mt-0.5 flex-shrink-0"
                  style={{ color: "#00bcd4" }}
                />
                <span style={{ color: "#c9d1d9" }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Why this exists */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ background: "#1c2128", border: "1px solid #30363d" }}
        >
          <h2 className="font-semibold text-lg" style={{ color: "#ffffff" }}>
            Why is this priced so low?
          </h2>
          <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#c9d1d9" }}>
            <p>A few weeks ago Proven AI did not exist. Today it does, and the people who join now will never pay more than $27 a month regardless of how much the platform grows.</p>
            <p>
              The price is low because the platform is still growing. Early members get the founding rate in exchange for being part of that growth from the start.
            </p>
            <p>
              What you will not get here is a course library, a government badge, or a generic newsletter written by an algorithm. What you will get is Jeff's direct read on what is working right now, filtered specifically for experienced business owners who are done experimenting and ready to implement.
            </p>
            <p>
              The founding rate locks the moment you subscribe. It does not change. When 50 founding spots fill, new members pay $47 and that becomes the permanent rate.
            </p>
            <p className="font-bold text-base" style={{ color: "#00bcd4" }}>
              14-day money back guarantee. No questions asked.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          {authLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#00bcd4" }} />
            </div>
          ) : isPaidMember ? (
            <div className="text-center space-y-3">
              <p className="font-medium" style={{ color: "#00bcd4" }}>
                You are already a ProvenAI Business Member.
              </p>
              <Button
                asChild
                className="h-11 px-8 font-semibold"
                style={{ background: "#00bcd4", color: "#0d1117" }}
              >
                <Link to="/control-centre">Go to your Dashboard</Link>
              </Button>
            </div>
          ) : (
            <>
              <Button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full h-12 text-base font-semibold"
                style={{ background: "#00bcd4", color: "#0d1117" }}
              >
                {checkoutLoading && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {isAuthenticated ? "Become a Founding Member — $27/month" : "Sign in to join"}
              </Button>
              {checkoutError && (
                <p className="text-sm text-center" style={{ color: "#f85149" }}>
                  {checkoutError}
                </p>
              )}
              <p className="text-xs text-center" style={{ color: "#8b949e" }}>
                Cancel anytime. No long-term commitment. Founding rate locked as long as you stay subscribed.
              </p>
            </>
          )}

          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: "#8b949e" }}>
            <Shield className="h-3 w-3 flex-shrink-0" />
            <span>
              Payments processed securely via Stripe. Recurring monthly billing. Cancel anytime.
            </span>
          </div>
          <p className="text-xs text-center" style={{ color: "#8b949e" }}>
            You may cancel anytime from your account settings. Cancellations take effect at the end of the billing period. To request a refund within 14 days of joining, email admin@provenai.app. By subscribing you agree to our{' '}
            <a href="/privacy" style={{ color: "#8b949e", textDecoration: "underline" }}>Privacy Policy</a>.
          </p>
        </div>

      </div>
    </div>
  );
}
