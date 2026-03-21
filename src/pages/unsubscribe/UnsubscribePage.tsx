import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, MailX, MailCheck, AlertTriangle } from "lucide-react";

const SAASDESK_BASE = "https://saasdesk.dev/api/contacts/unsubscribe";

type PageView =
  | "loading"
  | "confirm"
  | "success"
  | "already-unsubscribed"
  | "invalid-token"
  | "error";

const UnsubscribePage = () => {
  const { token } = useParams<{ token: string }>();

  const [view, setView] = useState<PageView>("loading");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResubscribing, setIsResubscribing] = useState(false);
  const [resubscribed, setResubscribed] = useState(false);
  const [resubscribeError, setResubscribeError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = () => {
    setView("loading");
    setRetryKey((k) => k + 1);
  };

  // ─── Load contact info on mount (and on retry) ────────────────────────────
  useEffect(() => {
    if (!token) {
      setView("invalid-token");
      return;
    }

    const controller = new AbortController();

    fetch(`${SAASDESK_BASE}/${encodeURIComponent(token)}`, {
      method: "GET",
      mode: "cors",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 404) {
          setView("invalid-token");
          return;
        }
        const data = await res.json() as {
          contact?: {
            id?: string;
            email?: string;
            unsubscribed?: boolean;
            unsubscribed_at?: string | null;
          };
          app?: { id?: string; name?: string; from_address?: string };
          error?: string;
        };
        if (!res.ok || !data.contact) {
          setView("invalid-token");
          return;
        }
        if (data.contact.unsubscribed) {
          setView("already-unsubscribed");
          return;
        }
        setEmail(data.contact.email ?? "");
        setView("confirm");
      })
      .catch((err) => {
        if ((err as Error).name !== "AbortError") {
          setView("error");
        }
      });

    return () => controller.abort();
  }, [token, retryKey]);

  // ─── Unsubscribe action ────────────────────────────────────────────────────
  const handleUnsubscribe = async () => {
    if (!token || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${SAASDESK_BASE}/${encodeURIComponent(token)}`, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (!res.ok || !data.success) {
        setView("error");
        return;
      }
      setView("success");
    } catch {
      setView("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Resubscribe action ───────────────────────────────────────────────────
  const handleResubscribe = async () => {
    if (!token || isResubscribing) return;
    setIsResubscribing(true);
    setResubscribeError(false);
    try {
      const res = await fetch(
        `https://saasdesk.dev/api/contacts/resubscribe/${encodeURIComponent(token)}`,
        {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
        }
      );
      const data = await res.json() as { success?: boolean; message?: string };
      if (res.ok && data.success) {
        setResubscribed(true);
      } else {
        setResubscribeError(true);
      }
    } catch {
      setResubscribeError(true);
    } finally {
      setIsResubscribing(false);
    }
  };

  // ─── View rendering ────────────────────────────────────────────────────────
  const renderContent = () => {
    if (view === "loading") {
      return (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      );
    }

    if (view === "confirm") {
      return (
        <div className="flex flex-col items-center gap-8 py-8 animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <MailX className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Unsubscribe from ProvenAI emails?
            </h1>
            {email && (
              <p className="text-muted-foreground">
                We'll stop sending emails to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <Button
              className="w-full h-12 text-base"
              variant="destructive"
              onClick={handleUnsubscribe}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unsubscribing…
                </>
              ) : (
                "Unsubscribe"
              )}
            </Button>

            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Never mind, keep me subscribed
            </Link>
          </div>
        </div>
      );
    }

    if (view === "success") {
      return (
        <div className="flex flex-col items-center gap-8 py-8 animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              You've been unsubscribed
            </h1>
            <p className="text-muted-foreground max-w-sm">
              You won't receive any more emails from ProvenAI.
            </p>
          </div>

          {!resubscribed ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Change your mind?{" "}
                <button
                  type="button"
                  onClick={handleResubscribe}
                  disabled={isResubscribing}
                  className="text-primary hover:underline disabled:opacity-50 transition-colors"
                >
                  {isResubscribing ? "Resubscribing…" : "Resubscribe"}
                </button>
              </p>
              {resubscribeError && (
                <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <MailCheck className="h-4 w-4" />
              <span>You're back on the list.</span>
            </div>
          )}
        </div>
      );
    }

    if (view === "already-unsubscribed") {
      return (
        <div className="flex flex-col items-center gap-6 py-8 animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MailX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Already unsubscribed
            </h1>
            <p className="text-muted-foreground max-w-sm">
              You're already unsubscribed from ProvenAI emails.
            </p>
          </div>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Proven AI
          </Link>
        </div>
      );
    }

    if (view === "invalid-token") {
      return (
        <div className="flex flex-col items-center gap-6 py-8 animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Link invalid or expired
            </h1>
            <p className="text-muted-foreground max-w-sm">
              This unsubscribe link is invalid or expired. If you'd like to
              unsubscribe, please use the link from your most recent ProvenAI
              email.
            </p>
          </div>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Proven AI
          </Link>
        </div>
      );
    }

    // Network / server error
    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-muted-foreground max-w-sm">
            We couldn't process your request. Please try again.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRetry}
          className="h-10"
        >
          Try again
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <span>← Back to Proven AI</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8 overflow-hidden h-[9.375rem]">
            <img
              src="/PROVEN%20AI%20MAIN6.png"
              alt="Proven AI"
              className="h-[16.875rem] w-auto -translate-y-14"
              width="1500"
              height="1050"
              loading="eager"
            />
          </div>

          {/* Card */}
          <div className="bg-background rounded-2xl border border-border p-8 shadow-sm">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UnsubscribePage;
