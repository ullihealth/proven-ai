import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerifyResult {
  verified: boolean;
  tier?: number;
  email?: string;
}

export default function MembershipSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id") ?? "";

  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setResult({ verified: false });
      setLoading(false);
      return;
    }

    fetch("/api/payments/verify-membership-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then((r) => r.json())
      .then((d) => setResult(d as VerifyResult))
      .catch(() => setResult({ verified: false }))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div
        style={{ background: "#0d1117", minHeight: "100vh" }}
        className="flex items-center justify-center"
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#00bcd4" }} />
      </div>
    );
  }

  if (!result?.verified) {
    return (
      <div
        style={{ background: "#0d1117", minHeight: "100vh", color: "#c9d1d9" }}
        className="flex items-center justify-center px-4"
      >
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold" style={{ color: "#ffffff" }}>
            We couldn&apos;t verify your payment
          </h1>
          <p className="text-sm" style={{ color: "#8b949e" }}>
            If you completed payment, your account will be upgraded within a few
            minutes. Check your email for a receipt, or contact support if you
            need help.
          </p>
          <Button asChild variant="outline">
            <Link to="/membership">Back to membership page</Link>
          </Button>
        </div>
      </div>
    );
  }

  const assessmentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    business_type: "",
    years_running: "",
    time_drains: "",
    ai_experience: "",
    success_definition: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/business/onboarding-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setSubmitted(true);
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: "#1c2128",
    border: "1px solid #30363d",
    color: "#c9d1d9",
    borderRadius: "8px",
    padding: "12px",
    width: "100%",
    fontSize: "14px",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "14px",
    color: "#c9d1d9",
    fontWeight: 500,
  } as React.CSSProperties;

  return (
    <div
      style={{ background: "#0d1117", minHeight: "100vh", color: "#c9d1d9" }}
      className="px-4 py-16"
    >
      <div className="max-w-2xl mx-auto">

        {/* ── SECTION 1: Welcome header ── */}
        <div className="flex flex-col items-center text-center space-y-5 mb-8">
          <div
            className="flex items-center justify-center w-20 h-20 rounded-full"
            style={{ background: "rgba(0,188,212,0.12)" }}
          >
            <CheckCircle2 className="h-10 w-10" style={{ color: "#00bcd4" }} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
              Welcome to Proven AI.
            </h1>
            <p className="text-base" style={{ color: "#c9d1d9" }}>
              You are a founding business member. Your rate is locked for life.
            </p>
          </div>
        </div>

        {/* ── SECTION 2: Video placeholder ── */}
        <div
          className="rounded-xl p-6 text-center flex flex-col items-center gap-3"
          style={{ background: "#1c2128", border: "1px solid #30363d" }}
        >
          <Play className="h-12 w-12" style={{ color: "#00bcd4" }} />
          <p className="text-sm" style={{ color: "#8b949e" }}>
            Welcome video coming soon.
          </p>
        </div>

        {/* ── SECTION 3: Action buttons ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Button
            asChild
            className="h-11 font-semibold w-full"
            style={{ background: "#00bcd4", color: "#0d1117" }}
          >
            <Link to="/control-centre">Go to the platform</Link>
          </Button>
          <Button
            className="h-11 font-semibold w-full"
            style={{
              background: "transparent",
              border: "1px solid #00bcd4",
              color: "#00bcd4",
            }}
            onClick={() =>
              assessmentRef.current?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Complete your business assessment
          </Button>
        </div>

        {/* ── SECTION 4: Divider ── */}
        <div className="flex items-center mt-16 gap-4">
          <div className="flex-1 h-px" style={{ background: "#30363d" }} />
          <span className="text-sm whitespace-nowrap" style={{ color: "#8b949e" }}>
            Your personalised business assessment
          </span>
          <div className="flex-1 h-px" style={{ background: "#30363d" }} />
        </div>

        {/* ── SECTION 5: Assessment form ── */}
        <div ref={assessmentRef} id="assessment" className="mt-8 space-y-4">
          <p className="text-sm" style={{ color: "#8b949e" }}>
            This is optional. Complete it now or return to it any time from your
            profile. The more detail you give, the more useful Jeff&apos;s response
            will be.
          </p>
          <button
            onClick={() => navigate("/control-centre")}
            className="text-sm underline"
            style={{ color: "#8b949e", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Skip for now
          </button>

          {submitted ? (
            <div className="space-y-6 pt-4">
              <p className="text-sm font-semibold" style={{ color: "#00bcd4" }}>
                Assessment received. Jeff will review it and you will hear back
                within a few days.
              </p>
              <Button
                asChild
                className="h-11 font-semibold w-full"
                style={{ background: "#00bcd4", color: "#0d1117" }}
              >
                <Link to="/control-centre">Go to the platform</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAssessmentSubmit} className="space-y-5 pt-2">
              <div>
                <label style={labelStyle}>Your name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  style={inputStyle}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>What kind of business do you run?</label>
                <textarea
                  rows={3}
                  placeholder="e.g. freelance copywriter, e-commerce store owner, consultant"
                  style={inputStyle}
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>How long have you been running it?</label>
                <select
                  style={inputStyle}
                  value={formData.years_running}
                  onChange={(e) => setFormData({ ...formData, years_running: e.target.value })}
                >
                  <option value="">Select an option</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1 to 3 years">1 to 3 years</option>
                  <option value="3 to 10 years">3 to 10 years</option>
                  <option value="More than 10 years">More than 10 years</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>What are your biggest time drains right now?</label>
                <textarea
                  rows={3}
                  placeholder="What tasks eat your time that AI might help with?"
                  style={inputStyle}
                  value={formData.time_drains}
                  onChange={(e) => setFormData({ ...formData, time_drains: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>What have you already tried with AI?</label>
                <textarea
                  rows={3}
                  placeholder="Tools you have used, what worked, what didn't"
                  style={inputStyle}
                  value={formData.ai_experience}
                  onChange={(e) => setFormData({ ...formData, ai_experience: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  What would make this membership worth every penny to you?
                </label>
                <textarea
                  rows={3}
                  placeholder="Be as specific as you like"
                  style={inputStyle}
                  value={formData.success_definition}
                  onChange={(e) =>
                    setFormData({ ...formData, success_definition: e.target.value })
                  }
                />
              </div>

              {submitError && (
                <p className="text-sm" style={{ color: "#f85149" }}>
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="h-11 font-semibold w-full mt-4"
                style={{ background: "#00bcd4", color: "#0d1117" }}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send my assessment to Jeff"
                )}
              </Button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
