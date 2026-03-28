import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import PromptGeneratorLandingPage from "./PromptGeneratorLandingPage";
import PromptGeneratorPage from "./PromptGeneratorPage";
import { Loader2 } from "lucide-react";

type RouteState =
  | { status: "loading" }
  | { status: "landing"; expiredToken?: boolean }
  | { status: "generator"; userType: "paid_member" | "free_subscriber"; email: string; token?: string };

const PromptGeneratorRouter = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user, isLoading: authLoading } = useAuth();
  const [routeState, setRouteState] = useState<RouteState>({ status: "loading" });

  useEffect(() => {
    if (authLoading) return;

    // If there's a session (paid member), show the generator
    if (user) {
      setRouteState({
        status: "generator",
        userType: "paid_member",
        email: user.email,
      });
      return;
    }

    // If there's a token param, validate it
    if (token) {
      let cancelled = false;
      (async () => {
        try {
          const res = await fetch(
            `/api/prompt-generator/validate-token?token=${encodeURIComponent(token)}`,
            { credentials: "include" }
          );
          const data = (await res.json()) as {
            valid: boolean;
            email?: string;
            user_type?: "free_subscriber";
          };

          if (!cancelled) {
            if (data.valid && data.email) {
              setRouteState({
                status: "generator",
                userType: "free_subscriber",
                email: data.email,
                token,
              });
            } else {
              setRouteState({ status: "landing", expiredToken: true });
            }
          }
        } catch {
          if (!cancelled) setRouteState({ status: "landing" });
        }
      })();

      return () => { cancelled = true; };
    }

    // No session, no token — show landing
    setRouteState({ status: "landing" });
  }, [authLoading, user, token]);

  if (routeState.status === "loading") {
    return (
      <div
        style={{ backgroundColor: "#0d1117", minHeight: "100vh" }}
        className="flex items-center justify-center"
      >
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#00bcd4" }} />
      </div>
    );
  }

  if (routeState.status === "generator") {
    return (
      <PromptGeneratorPage
        userType={routeState.userType}
        userEmail={routeState.email}
        guestToken={routeState.token}
      />
    );
  }

  return <PromptGeneratorLandingPage expiredToken={routeState.expiredToken} />;
};

export default PromptGeneratorRouter;
