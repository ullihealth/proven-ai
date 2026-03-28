import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";

const TURNSTILE_SITE_KEY = "0x4AAAAAACxQx_uhOzk2K4m3";

interface PromptGeneratorLandingPageProps {
  expiredToken?: boolean;
}

const PromptGeneratorLandingPage = ({ expiredToken }: PromptGeneratorLandingPageProps) => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const turnstileTokenRef = useRef<string>("");

  // Load Turnstile script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Register Turnstile success callback
  useEffect(() => {
    (window as Record<string, unknown>).onTurnstileSuccess = (token: string) => {
      turnstileTokenRef.current = token;
    };
    return () => {
      delete (window as Record<string, unknown>).onTurnstileSuccess;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    const trimmedName = firstName.trim();
    if (!trimmedName) {
      setError("Please enter your first name.");
      return;
    }
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!turnstileTokenRef.current) {
      setError("Please complete the security check.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/prompt-generator/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, first_name: trimmedName, marketing_consent: marketingConsent, cf_turnstile_token: turnstileTokenRef.current }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "Server error");
      }
      setSubmitted(true);
      if ((window as Record<string, unknown>).turnstile) {
        (window as { turnstile?: { reset: () => void } }).turnstile?.reset();
      }
      turnstileTokenRef.current = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    "Choose from 8 topic categories",
    "Set your tone, length, and audience",
    "Copy, download, or get a new version instantly",
  ];

  return (
    <div
      style={{ backgroundColor: "#0d1117", minHeight: "100vh" }}
      className="flex items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-md">
        {/* Logo / brand mark */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#00bcd4" }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span
            className="text-xl font-semibold tracking-tight"
            style={{ color: "#c9d1d9" }}
          >
            Proven AI
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 space-y-6"
          style={{ backgroundColor: "#1c2128", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Expired token notice */}
          {expiredToken && !submitted && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: "rgba(233,30,140,0.08)",
                border: "1px solid rgba(233,30,140,0.25)",
                color: "#e91e8c",
              }}
            >
              That link has expired. Enter your email below for a new one.
            </div>
          )}

          {/* Headline */}
          <div className="text-center space-y-2">
            <h1
              className="text-2xl font-bold leading-tight"
              style={{ color: "#c9d1d9" }}
            >
              Build Better AI Prompts —<br />In Seconds
            </h1>
            <p className="text-sm" style={{ color: "rgba(201,209,217,0.65)" }}>
              Get free access to the Proven AI Prompt Generator. Enter your
              email and we'll send you your personal access link.
            </p>
          </div>

          {/* Form or success message */}
          {submitted ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2
                className="h-10 w-10 mx-auto"
                style={{ color: "#00bcd4" }}
              />
              <p className="font-medium" style={{ color: "#c9d1d9" }}>
                Check your inbox.
              </p>
              <p className="text-sm" style={{ color: "rgba(201,209,217,0.65)" }}>
                Your access link is on its way.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                autoComplete="given-name"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#c9d1d9",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00bcd4"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#c9d1d9",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#00bcd4";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                }}
              />

              {error && (
                <p className="text-sm" style={{ color: "#e91e8c" }}>
                  {error}
                </p>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 flex-shrink-0 accent-cyan-400"
                />
                <span className="text-xs leading-relaxed" style={{ color: "rgba(201,209,217,0.55)" }}>
                  I'm happy to receive emails from Proven AI about AI tips, tools and updates.
                </span>
              </label>

              <div
                className="cf-turnstile"
                data-sitekey={TURNSTILE_SITE_KEY}
                data-callback="onTurnstileSuccess"
                data-theme="dark"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg py-3 text-sm font-semibold transition-opacity flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#00bcd4",
                  color: "#fff",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Send My Access Link
              </button>
            </form>
          )}

          {/* Sign-in link */}
          <p className="text-center text-xs" style={{ color: "rgba(201,209,217,0.45)" }}>
            Already a Proven AI member?{" "}
            <Link
              to="/auth"
              className="underline transition-colors"
              style={{ color: "rgba(201,209,217,0.7)" }}
            >
              Sign in for unlimited access.
            </Link>
          </p>

          {/* Feature bullets */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            {features.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm" style={{ color: "rgba(201,209,217,0.7)" }}>
                <span
                  className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#00bcd4" }}
                />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptGeneratorLandingPage;
