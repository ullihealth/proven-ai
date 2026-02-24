import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

type AuthMode = "signin" | "signup";
type SiteMode = "live" | "coming_soon" | null; // null = loading

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, isLoading } = useAuth();
  
  const [siteMode, setSiteMode] = useState<SiteMode>(null);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");

  // Check site mode on mount
  useEffect(() => {
    fetch("/api/site-settings?key=auth_mode")
      .then((r) => r.json())
      .then((data: { ok?: boolean; value?: string }) => {
        setSiteMode(data.value === "coming_soon" ? "coming_soon" : "live");
      })
      .catch(() => setSiteMode("live")); // default to live on error
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError("");
    setWaitlistSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setWaitlistError(data.error || "Something went wrong. Please try again.");
      } else {
        setWaitlistDone(true);
      }
    } catch {
      setWaitlistError("Something went wrong. Please try again.");
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  // Get the redirect path from location state, default to home
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      let result;
      if (mode === "signin") {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, name);
      }

      if (result.error) {
        setError(result.error);
      } else {
        // Redirect to the page they tried to visit or home
        navigate(from, { replace: true });
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError("");
  };

  // Loading state while checking site mode
  if (siteMode === null) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="p-4 border-b border-border">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Proven AI</span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  // ─── Coming Soon view ───
  if (siteMode === "coming_soon") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="p-4 border-b border-border">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Proven AI</span>
          </Link>
        </header>

        <main className="flex-1 flex items-start justify-center p-4">
          <div className="w-full max-w-sm space-y-6">
            {/* Logo — identical to sign-in */}
            <div className="text-center">
              <div className="flex justify-center overflow-hidden">
                <img src="/PROVEN%20AI%20MAIN6.png" alt="Proven AI" className="h-[16.875rem] w-auto -mt-14 -mb-16" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Coming Soon</h1>
              <p className="text-muted-foreground mt-1">
                Proven AI is launching very shortly. Enter your email below to be notified the moment we go live.
              </p>
            </div>

            {waitlistDone ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <p className="text-center text-foreground font-medium">
                  You're on the list. We'll be in touch very soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="waitlist-email">Email</Label>
                  <Input
                    id="waitlist-email"
                    type="email"
                    placeholder="you@example.com"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="h-12"
                    autoComplete="email"
                    required
                  />
                </div>

                {waitlistError && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {waitlistError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={waitlistSubmitting}
                >
                  {waitlistSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Notify Me"
                  )}
                </Button>
              </form>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ─── Normal sign-in / sign-up view ───
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Proven AI</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="flex justify-center overflow-hidden">
              <img src="/PROVEN%20AI%20MAIN6.png" alt="Proven AI" className="h-[16.875rem] w-auto -mt-14 -mb-16" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "signin"
                ? "Sign in to access your account"
                : "Get started with Proven AI"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "signin" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                mode === "signin" ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          {/* Toggle mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <span className="text-primary font-medium">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span className="text-primary font-medium">Sign in</span>
                </>
              )}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AuthPage;
