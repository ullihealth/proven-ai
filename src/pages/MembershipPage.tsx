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
  "Access to all Proven AI courses",
  "AI Prompt Generator — Claude, Groq & Gemini with higher daily limits",
  "All future platform features as they launch",
  "Founding member status",
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

  const progressPercent = tierData
    ? tierData.tier === 3
      ? 100
      : Math.min(
          100,
          Math.round(
            ((tierData.members_at_this_tier) / tierData.tier_limit) * 100
          )
        )
    : 0;

  return (
    <div
      style={{ background: "#0d1117", minHeight: "100vh", color: "#c9d1d9" }}
      className="py-16 px-4"
    >
      <div className="max-w-2xl mx-auto space-y-10">

        {/* Hero */}
        <div className="text-center space-y-3">
          <h1
            className="text-4xl font-bold"
            style={{ color: "#ffffff" }}
          >
            Proven AI Founding Membership
          </h1>
          <p className="text-lg" style={{ color: "#c9d1d9" }}>
            Lifetime access. One payment. No subscriptions.
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

        {/* Current Tier Card */}
        <div
          className="rounded-xl p-6 space-y-5"
          style={{ background: "#1c2128", border: "1px solid #30363d" }}
        >
          {tierLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#00bcd4" }} />
            </div>
          ) : tierData ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className="text-xs font-semibold uppercase tracking-widest mb-1"
                    style={{ color: "#00bcd4" }}
                  >
                    Founding Member Tier {tierData.tier}
                  </div>
                  <div
                    className="text-4xl font-bold"
                    style={{ color: "#ffffff" }}
                  >
                    ${tierData.price_usd}
                  </div>
                  <div className="text-sm mt-1" style={{ color: "#c9d1d9" }}>
                    one-time payment
                  </div>
                </div>
                <div className="text-right">
                  {tierData.tier < 3 ? (
                    <>
                      <div
                        className="text-2xl font-bold"
                        style={{ color: "#00bcd4" }}
                      >
                        {tierData.spots_remaining}
                      </div>
                      <div className="text-xs" style={{ color: "#8b949e" }}>
                        spots left at this price
                      </div>
                    </>
                  ) : (
                    <div className="text-xs" style={{ color: "#8b949e" }}>
                      Final tier
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {tierData.tier < 3 && (
                <div>
                  <div
                    className="w-full rounded-full h-2 overflow-hidden"
                    style={{ background: "#30363d" }}
                  >
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${progressPercent}%`,
                        background: "#00bcd4",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1.5" style={{ color: "#8b949e" }}>
                    <span>{tierData.members_at_this_tier} joined at this tier</span>
                    <span>{tierData.tier_limit} total spots</span>
                  </div>
                </div>
              )}

              <p className="text-xs" style={{ color: "#8b949e" }}>
                Price increases automatically when this tier fills. No countdown.
                No pressure. Just facts.
              </p>
            </>
          ) : (
            <p className="text-sm text-center py-4" style={{ color: "#8b949e" }}>
              Unable to load pricing. Please refresh.
            </p>
          )}
        </div>

        {/* What's included */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ background: "#1c2128", border: "1px solid #30363d" }}
        >
          <h2 className="font-semibold text-lg" style={{ color: "#ffffff" }}>
            What's included
          </h2>
          <ul className="space-y-3">
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

        {/* CTA */}
        <div className="space-y-4">
          {authLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#00bcd4" }} />
            </div>
          ) : isPaidMember ? (
            <div className="text-center space-y-2">
              <p className="font-medium" style={{ color: "#00bcd4" }}>
                You&apos;re already a founding member.
              </p>
              <Link
                to="/dashboard"
                className="text-sm underline"
                style={{ color: "#8b949e" }}
              >
                Go to your dashboard
              </Link>
            </div>
          ) : (
            <>
              <Button
                onClick={handleCheckout}
                disabled={checkoutLoading || tierLoading}
                className="w-full h-12 text-base font-semibold"
                style={{ background: "#00bcd4", color: "#0d1117" }}
              >
                {checkoutLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isAuthenticated
                  ? `Become a Founding Member — $${tierData?.price_usd ?? "…"}`
                  : "Sign in to Purchase"}
              </Button>
              {checkoutError && (
                <p className="text-sm text-center" style={{ color: "#f85149" }}>
                  {checkoutError}
                </p>
              )}
            </>
          )}

          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: "#8b949e" }}>
            <Shield className="h-3 w-3" />
            <span>
              Secure payment via Stripe. Your membership is lifetime — no recurring charges.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
