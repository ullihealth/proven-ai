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

const LIFETIME_INCLUDED = [
  "Full access to the Proven AI platform and course library",
  "New premium courses included automatically 6 months after launch",
  "AI Prompt Generator with higher daily limits",
  "Curated AI tools directory, updated regularly",
  "Founding member pricing locked for life",
  "Founding member status — recognised as an early supporter",
];

const BUSINESS_INCLUDED = [
  "Everything in the Lifetime Membership included",
  "Business Dashboard — Jeff's curated AI business feed",
  "Monthly business hack exclusive to business members",
  "Weekly AI tools update for business owners",
  "Monthly newsletter — Jeff's take on where AI is heading",
  "One coaching email reply per week",
  "Personalised business onboarding assessment and report",
  "Founding rate locked for life as long as you stay subscribed",
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
  const [progressVisible, setProgressVisible] = useState(false);

  const [bizEmail, setBizEmail] = useState("");
  const [bizStatus, setBizStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const isPaidMember = user?.role === "paid_member" || user?.role === "admin";

  useEffect(() => {
    fetch("/api/payments/membership-tier")
      .then((r) => r.json())
      .then((d) => setTierData(d as TierData))
      .catch(console.error)
      .finally(() => setTierLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/site-settings?key=membership_progress_visible")
      .then((r) => r.json())
      .then((d: { ok?: boolean; value?: string | null }) => {
        setProgressVisible(d.value === "true");
      })
      .catch(() => setProgressVisible(false));
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

  async function handleBizPreregister(e: React.FormEvent) {
    e.preventDefault();
    if (!bizEmail.trim()) return;
    setBizStatus("loading");
    try {
      const res = await fetch("/api/membership/business-preregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: bizEmail.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      setBizStatus(data.ok ? "success" : "error");
    } catch {
      setBizStatus("error");
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
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold" style={{ color: "#ffffff" }}>
            Proven AI Founding Membership
          </h1>
          <p className="text-lg" style={{ color: "#c9d1d9" }}>
            AI guidance that grows with you. Choose the membership that fits.
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

        {/* Two-column tier grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* LEFT — Lifetime */}
          <div
            className="rounded-xl p-6 space-y-5"
            style={{ background: "#1c2128", border: "1px solid #30363d" }}
          >
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "#00bcd4" }}
              >
                Founding Member
              </div>
              <div className="text-3xl font-bold" style={{ color: "#ffffff" }}>
                $97 one-time
              </div>
              <div className="text-sm mt-1" style={{ color: "#8b949e" }}>
                Lifetime access, one payment
              </div>
            </div>

            {/* Tier progress */}
            {tierLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#00bcd4" }} />
              </div>
            ) : tierData && progressVisible ? (
              <div className="space-y-2">
                {tierData.tier < 3 && (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div
                          className="text-xs font-semibold uppercase tracking-widest"
                          style={{ color: "#00bcd4" }}
                        >
                          Tier {tierData.tier}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold" style={{ color: "#00bcd4" }}>
                          {tierData.spots_remaining}
                        </div>
                        <div className="text-xs" style={{ color: "#8b949e" }}>
                          spots left at this price
                        </div>
                      </div>
                    </div>
                    <div
                      className="w-full rounded-full h-2 overflow-hidden"
                      style={{ background: "#30363d" }}
                    >
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${progressPercent}%`, background: "#00bcd4" }}
                      />
                    </div>
                    <div
                      className="flex justify-between text-xs"
                      style={{ color: "#8b949e" }}
                    >
                      <span>{tierData.members_at_this_tier} joined</span>
                      <span>{tierData.tier_limit} spots</span>
                    </div>
                  </>
                )}
                <p className="text-xs" style={{ color: "#8b949e" }}>
                  Price increases automatically when this tier fills.
                </p>
              </div>
            ) : null}

            {/* What's included */}
            <ul className="space-y-2.5">
              {LIFETIME_INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2
                    className="h-4 w-4 mt-0.5 flex-shrink-0"
                    style={{ color: "#00bcd4" }}
                  />
                  <span style={{ color: "#c9d1d9" }}>{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="space-y-3 pt-1">
              {authLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#00bcd4" }} />
                </div>
              ) : isPaidMember ? (
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium" style={{ color: "#00bcd4" }}>
                    You are already a founding member.
                  </p>
                  <Button
                    asChild
                    className="h-10 px-6 font-semibold"
                    style={{ background: "#00bcd4", color: "#0d1117" }}
                  >
                    <Link to="/dashboard">Go to your Dashboard</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {!isAuthenticated && (
                    <p className="text-xs text-center" style={{ color: "#8b949e" }}>
                      <Link to="/auth" className="underline" style={{ color: "#00bcd4" }}>
                        Sign in
                      </Link>{" "}
                      or create an account to purchase.
                    </p>
                  )}
                  <Button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || tierLoading}
                    className="w-full h-11 text-sm font-semibold"
                    style={{ background: "#00bcd4", color: "#0d1117" }}
                  >
                    {checkoutLoading && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {isAuthenticated
                      ? `Become a Founding Member — $${tierData?.price_usd ?? "…"}`
                      : "Sign in to Purchase"}
                  </Button>
                  {checkoutError && (
                    <p className="text-xs text-center" style={{ color: "#f85149" }}>
                      {checkoutError}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT — Business */}
          <div
            className="rounded-xl p-6 space-y-5"
            style={{
              background: "#1c2128",
              border: "1px solid rgba(233, 30, 140, 0.4)",
            }}
          >
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "#e91e8c" }}
              >
                Business Founding Member — Coming Soon
              </div>
              <div className="text-3xl font-bold" style={{ color: "#ffffff" }}>
                $17/month founding rate
              </div>
              <div className="text-sm mt-1" style={{ color: "#8b949e" }}>
                Locks in permanently. Rises to $27 at launch.
              </div>
            </div>

            <ul className="space-y-2.5">
              {BUSINESS_INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2
                    className="h-4 w-4 mt-0.5 flex-shrink-0"
                    style={{ color: "#e91e8c" }}
                  />
                  <span style={{ color: "#c9d1d9" }}>{item}</span>
                </li>
              ))}
            </ul>

            {/* Pre-reg form */}
            <div className="space-y-3 pt-1">
              {bizStatus === "success" ? (
                <div
                  className="rounded-lg p-4 text-sm text-center"
                  style={{
                    background: "rgba(233, 30, 140, 0.08)",
                    border: "1px solid rgba(233, 30, 140, 0.3)",
                    color: "#c9d1d9",
                  }}
                >
                  You're on the list. We'll contact you before launch with next
                  steps.
                </div>
              ) : (
                <form onSubmit={handleBizPreregister} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={bizEmail}
                    onChange={(e) => setBizEmail(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{
                      background: "#0d1117",
                      border: "1px solid #30363d",
                      color: "#c9d1d9",
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={bizStatus === "loading"}
                    className="w-full h-11 text-sm font-semibold"
                    style={{ background: "#e91e8c", color: "#ffffff" }}
                  >
                    {bizStatus === "loading" && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Reserve my founding rate
                  </Button>
                  {bizStatus === "error" && (
                    <p className="text-xs text-center" style={{ color: "#f85149" }}>
                      Something went wrong. Please try again.
                    </p>
                  )}
                </form>
              )}
              <p className="text-xs text-center" style={{ color: "#8b949e" }}>
                No payment taken now. We'll contact you before launch.
              </p>
            </div>
          </div>
        </div>

        {/* Why so low */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ background: "#1c2128", border: "1px solid #30363d" }}
        >
          <h2 className="font-semibold text-lg" style={{ color: "#ffffff" }}>
            Why are the founding memberships priced so low?
          </h2>
          <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#c9d1d9" }}>
            <p>
              Honestly? Because I personally hate monthly subscriptions, and I
              wouldn't wish that on anyone else.
            </p>
            <p>
              I was once part of a community that offered a low lifetime
              membership and it did something remarkable. It built genuine
              community. That's exactly what Proven AI is designed to do.
            </p>
            <p>
              Many platforms launch at a high price, drop it with countdown
              timers and urgency tactics, then disappear eight weeks later.
              I've seen it too many times. That's not this.
            </p>
            <p>AI is here to stay. And so am I.</p>
            <p>
              Founding members take a chance on something early. In return,
              they benefit forever. No future charges, no tier downgrades, no
              surprises. Premium courses will be available for those who want
              the latest content as it launches, and that's how the platform
              sustains itself. But the founding membership is about building
              something real, not extracting maximum revenue from people who
              trusted early.
            </p>
            <p>
              Providing genuine value is how Proven AI earns its place as a
              platform worth recommending. Not through scarcity tactics.
              Through results.
            </p>
            <p className="font-bold text-base" style={{ color: "#00bcd4" }}>
              30-day money back guarantee. No questions asked.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: "#8b949e" }}>
          <Shield className="h-3 w-3 flex-shrink-0" />
          <span>
            Lifetime membership payments are processed securely via Stripe.
            Business membership billing opens at launch.
          </span>
        </div>

      </div>
    </div>
  );
}
