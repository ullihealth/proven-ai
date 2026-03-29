import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2 } from "lucide-react";
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

  return (
    <div
      style={{ background: "#0d1117", minHeight: "100vh", color: "#c9d1d9" }}
      className="flex items-center justify-center px-4"
    >
      <div className="max-w-lg w-full text-center space-y-8">

        {/* Check icon */}
        <div className="flex justify-center">
          <div
            className="flex items-center justify-center w-20 h-20 rounded-full"
            style={{ background: "rgba(0,188,212,0.12)" }}
          >
            <CheckCircle2 className="h-10 w-10" style={{ color: "#00bcd4" }} />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
            Welcome to Proven AI, Founding Member.
          </h1>
          <p className="text-base" style={{ color: "#c9d1d9" }}>
            Your account has been upgraded. Everything is ready for you.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            className="h-11 px-6 font-semibold"
            style={{ background: "#00bcd4", color: "#0d1117" }}
          >
            <Link to="/courses">Go to Courses</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 px-6"
            style={{ borderColor: "#30363d", color: "#c9d1d9" }}
          >
            <Link to="/promptgenerator">Try the Prompt Generator</Link>
          </Button>
        </div>

        {result.email && (
          <p className="text-xs" style={{ color: "#8b949e" }}>
            Your founding member receipt has been sent to {result.email}.
          </p>
        )}

      </div>
    </div>
  );
}
